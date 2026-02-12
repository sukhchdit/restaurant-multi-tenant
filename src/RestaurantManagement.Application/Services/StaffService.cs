using AutoMapper;
using Microsoft.EntityFrameworkCore;
using RestaurantManagement.Application.DTOs.Common;
using RestaurantManagement.Application.DTOs.Staff;
using RestaurantManagement.Application.Interfaces;
using RestaurantManagement.Domain.Entities;
using RestaurantManagement.Domain.Enums;
using RestaurantManagement.Domain.Interfaces;
using RestaurantManagement.Shared.Responses;

namespace RestaurantManagement.Application.Services;

public class StaffService : IStaffService
{
    private readonly IRepository<Staff> _staffRepository;
    private readonly IRepository<Attendance> _attendanceRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICurrentUserService _currentUser;
    private readonly IMapper _mapper;

    public StaffService(
        IRepository<Staff> staffRepository,
        IRepository<Attendance> attendanceRepository,
        IUnitOfWork unitOfWork,
        ICurrentUserService currentUser,
        IMapper mapper)
    {
        _staffRepository = staffRepository;
        _attendanceRepository = attendanceRepository;
        _unitOfWork = unitOfWork;
        _currentUser = currentUser;
        _mapper = mapper;
    }

    public async Task<ApiResponse<PaginatedResultDto<StaffDto>>> GetStaffAsync(
        int pageNumber = 1, int pageSize = 20, string? search = null,
        CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<PaginatedResultDto<StaffDto>>.Fail("Restaurant context not found.", 403);

        var query = _staffRepository.QueryNoTracking()
            .Where(s => s.RestaurantId == restaurantId.Value && !s.IsDeleted);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(s => s.FullName.ToLower().Contains(searchLower)
                                     || (s.Email != null && s.Email.ToLower().Contains(searchLower))
                                     || (s.Phone != null && s.Phone.Contains(search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var staff = await query
            .OrderBy(s => s.FullName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtos = _mapper.Map<List<StaffDto>>(staff);
        var result = new PaginatedResultDto<StaffDto>(dtos, totalCount, pageNumber, pageSize);

        return ApiResponse<PaginatedResultDto<StaffDto>>.Ok(result);
    }

    public async Task<ApiResponse<StaffDto>> CreateStaffAsync(CreateStaffDto dto, CancellationToken cancellationToken = default)
    {
        var restaurantId = _currentUser.RestaurantId;
        if (restaurantId == null)
            return ApiResponse<StaffDto>.Fail("Restaurant context not found.", 403);

        var staffMember = new Staff
        {
            RestaurantId = restaurantId.Value,
            TenantId = _currentUser.TenantId ?? Guid.Empty,
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            Role = dto.Role,
            Shift = dto.Shift,
            JoinDate = dto.JoinDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
            Salary = dto.Salary,
            Status = StaffStatus.Active,
            CreatedBy = _currentUser.UserId
        };

        await _staffRepository.AddAsync(staffMember, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<StaffDto>(staffMember);
        return ApiResponse<StaffDto>.Ok(result, "Staff member created successfully.");
    }

    public async Task<ApiResponse<StaffDto>> UpdateStaffAsync(Guid id, CreateStaffDto dto, CancellationToken cancellationToken = default)
    {
        var staffMember = await _staffRepository.GetByIdAsync(id, cancellationToken);
        if (staffMember == null || staffMember.IsDeleted)
            return ApiResponse<StaffDto>.Fail("Staff member not found.", 404);

        staffMember.FullName = dto.FullName;
        staffMember.Email = dto.Email;
        staffMember.Phone = dto.Phone;
        staffMember.Role = dto.Role;
        staffMember.Shift = dto.Shift;
        if (dto.JoinDate.HasValue) staffMember.JoinDate = dto.JoinDate;
        if (dto.Salary.HasValue) staffMember.Salary = dto.Salary;
        staffMember.UpdatedAt = DateTime.UtcNow;
        staffMember.UpdatedBy = _currentUser.UserId;

        _staffRepository.Update(staffMember);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<StaffDto>(staffMember);
        return ApiResponse<StaffDto>.Ok(result, "Staff member updated successfully.");
    }

    public async Task<ApiResponse> DeleteStaffAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var staffMember = await _staffRepository.GetByIdAsync(id, cancellationToken);
        if (staffMember == null || staffMember.IsDeleted)
            return ApiResponse.Fail("Staff member not found.", 404);

        staffMember.IsDeleted = true;
        staffMember.DeletedAt = DateTime.UtcNow;
        staffMember.DeletedBy = _currentUser.UserId;
        staffMember.Status = StaffStatus.Inactive;

        _staffRepository.Update(staffMember);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return ApiResponse.Ok("Staff member deleted successfully.");
    }

    public async Task<ApiResponse<List<AttendanceDto>>> GetAttendanceAsync(
        Guid staffId, DateOnly? fromDate = null, DateOnly? toDate = null,
        CancellationToken cancellationToken = default)
    {
        var query = _attendanceRepository.QueryNoTracking()
            .Include(a => a.Staff)
            .Where(a => a.StaffId == staffId && !a.IsDeleted);

        if (fromDate.HasValue)
            query = query.Where(a => a.Date >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(a => a.Date <= toDate.Value);

        var records = await query
            .OrderByDescending(a => a.Date)
            .ToListAsync(cancellationToken);

        var result = _mapper.Map<List<AttendanceDto>>(records);
        return ApiResponse<List<AttendanceDto>>.Ok(result);
    }

    public async Task<ApiResponse<AttendanceDto>> CheckInAsync(Guid staffId, CancellationToken cancellationToken = default)
    {
        var staffMember = await _staffRepository.GetByIdAsync(staffId, cancellationToken);
        if (staffMember == null || staffMember.IsDeleted)
            return ApiResponse<AttendanceDto>.Fail("Staff member not found.", 404);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var existingAttendance = await _attendanceRepository.FirstOrDefaultAsync(
            a => a.StaffId == staffId && a.Date == today && !a.IsDeleted, cancellationToken);

        if (existingAttendance != null && existingAttendance.CheckIn.HasValue)
            return ApiResponse<AttendanceDto>.Fail("Staff member has already checked in today.");

        var attendance = existingAttendance ?? new Attendance
        {
            StaffId = staffId,
            TenantId = staffMember.TenantId,
            Date = today,
            CreatedBy = _currentUser.UserId
        };

        attendance.CheckIn = DateTime.UtcNow;
        attendance.Status = "Present";

        if (existingAttendance == null)
            await _attendanceRepository.AddAsync(attendance, cancellationToken);
        else
            _attendanceRepository.Update(attendance);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<AttendanceDto>(attendance);
        result.StaffName = staffMember.FullName;

        return ApiResponse<AttendanceDto>.Ok(result, "Checked in successfully.");
    }

    public async Task<ApiResponse<AttendanceDto>> CheckOutAsync(Guid staffId, CancellationToken cancellationToken = default)
    {
        var staffMember = await _staffRepository.GetByIdAsync(staffId, cancellationToken);
        if (staffMember == null || staffMember.IsDeleted)
            return ApiResponse<AttendanceDto>.Fail("Staff member not found.", 404);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var attendance = await _attendanceRepository.FirstOrDefaultAsync(
            a => a.StaffId == staffId && a.Date == today && !a.IsDeleted, cancellationToken);

        if (attendance == null || !attendance.CheckIn.HasValue)
            return ApiResponse<AttendanceDto>.Fail("Staff member has not checked in today.");

        if (attendance.CheckOut.HasValue)
            return ApiResponse<AttendanceDto>.Fail("Staff member has already checked out today.");

        attendance.CheckOut = DateTime.UtcNow;
        attendance.UpdatedAt = DateTime.UtcNow;
        attendance.UpdatedBy = _currentUser.UserId;

        _attendanceRepository.Update(attendance);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var result = _mapper.Map<AttendanceDto>(attendance);
        result.StaffName = staffMember.FullName;

        return ApiResponse<AttendanceDto>.Ok(result, "Checked out successfully.");
    }
}

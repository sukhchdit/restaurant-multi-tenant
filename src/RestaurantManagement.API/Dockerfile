FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy solution and project files for restore
COPY ["RestaurantManagement.slnx", "."]
COPY ["src/RestaurantManagement.API/RestaurantManagement.API.csproj", "src/RestaurantManagement.API/"]
COPY ["src/RestaurantManagement.Application/RestaurantManagement.Application.csproj", "src/RestaurantManagement.Application/"]
COPY ["src/RestaurantManagement.Domain/RestaurantManagement.Domain.csproj", "src/RestaurantManagement.Domain/"]
COPY ["src/RestaurantManagement.Infrastructure/RestaurantManagement.Infrastructure.csproj", "src/RestaurantManagement.Infrastructure/"]
COPY ["src/RestaurantManagement.Shared/RestaurantManagement.Shared.csproj", "src/RestaurantManagement.Shared/"]
RUN dotnet restore "src/RestaurantManagement.API/RestaurantManagement.API.csproj"

# Copy everything and build
COPY . .
WORKDIR "/src/src/RestaurantManagement.API"
RUN dotnet build "RestaurantManagement.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "RestaurantManagement.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Create uploads directory
RUN mkdir -p /app/uploads

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "RestaurantManagement.API.dll"]

import * as signalR from '@microsoft/signalr';

const SIGNALR_URL = import.meta.env.VITE_SIGNALR_URL || 'http://localhost:5000/hubs';

class SignalRService {
  private connections: Map<string, signalR.HubConnection> = new Map();

  async connect(hubName: string): Promise<signalR.HubConnection> {
    const existingConnection = this.connections.get(hubName);
    if (existingConnection?.state === signalR.HubConnectionState.Connected) {
      return existingConnection;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${SIGNALR_URL}/${hubName}`, {
        accessTokenFactory: () => localStorage.getItem('accessToken') || '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connection.onreconnecting(() => {
      console.log(`SignalR reconnecting to ${hubName}...`);
    });

    connection.onreconnected(() => {
      console.log(`SignalR reconnected to ${hubName}`);
    });

    connection.onclose(() => {
      console.log(`SignalR connection to ${hubName} closed`);
      this.connections.delete(hubName);
    });

    try {
      await connection.start();
      this.connections.set(hubName, connection);
      console.log(`SignalR connected to ${hubName}`);
      return connection;
    } catch (error) {
      console.error(`SignalR connection to ${hubName} failed:`, error);
      throw error;
    }
  }

  async disconnect(hubName: string): Promise<void> {
    const connection = this.connections.get(hubName);
    if (connection) {
      await connection.stop();
      this.connections.delete(hubName);
    }
  }

  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.connections.entries()).map(([name, conn]) => {
      return conn.stop().then(() => this.connections.delete(name));
    });
    await Promise.all(promises);
  }

  getConnection(hubName: string): signalR.HubConnection | undefined {
    return this.connections.get(hubName);
  }
}

export const signalRService = new SignalRService();

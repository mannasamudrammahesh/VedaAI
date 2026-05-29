import WebSocket, { Server } from 'ws';
import { Server as HttpServer } from 'http';

interface ClientMetadata {
  ws: WebSocket;
  assignmentId?: string;
}

export class SocketManager {
  private static instance: SocketManager;
  private wss: Server | null = null;
  private clients: Map<string, ClientMetadata> = new Map();

  private constructor() {}

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  public init(server: HttpServer): void {
    this.wss = new Server({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;

      if (pathname === '/ws') {
        this.wss?.handleUpgrade(request, socket, head, (ws) => {
          this.wss?.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    this.wss.on('connection', (ws: WebSocket) => {
      const clientId = Math.random().toString(36).substring(2, 15);
      console.log(`WebSocket connected. Assigning ID: ${clientId}`);

      this.clients.set(clientId, { ws });

      ws.send(JSON.stringify({ type: 'CONNECTION_ACK', data: { clientId } }));

      ws.on('message', (message: string) => {
        try {
          const parsed = JSON.parse(message);
          if (parsed.type === 'SUBSCRIBE_JOB') {
            const { assignmentId } = parsed.data;
            const client = this.clients.get(clientId);
            if (client) {
              client.assignmentId = assignmentId;
              this.clients.set(clientId, client);
              console.log(`Client ${clientId} subscribed to assignment: ${assignmentId}`);
              
              // Echo subscription acknowledgment
              ws.send(JSON.stringify({
                type: 'SUBSCRIBED',
                data: { assignmentId }
              }));
            }
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log(`WebSocket disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (err) => {
        console.error(`WebSocket error for client ${clientId}:`, err);
        this.clients.delete(clientId);
      });
    });
  }

  public sendToAssignmentSubscribers(assignmentId: string, type: string, payload: any): void {
    this.clients.forEach((client, clientId) => {
      if (client.assignmentId === assignmentId && client.ws.readyState === WebSocket.OPEN) {
        console.log(`Sending update to client ${clientId} for assignment ${assignmentId}`);
        client.ws.send(JSON.stringify({ type, data: payload }));
      }
    });
  }

  public broadcast(type: string, payload: any): void {
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify({ type, data: payload }));
      }
    });
  }
}

export const socketManager = SocketManager.getInstance();

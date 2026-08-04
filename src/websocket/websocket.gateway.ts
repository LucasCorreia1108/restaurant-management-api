import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WS_EVENTS, WsEvent } from '../common/constants/websocket-events';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/realtime',
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  afterInit() {
    this.logger.log('WebSocket gateway initialized on /realtime');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emit(event: WsEvent, payload: unknown) {
    this.server.emit(event, payload);
    this.logger.debug(`Emitted ${event}`);
  }

  emitOrderCreated(payload: unknown) {
    this.emit(WS_EVENTS.ORDER_CREATED, payload);
  }

  emitOrderSent(payload: unknown) {
    this.emit(WS_EVENTS.ORDER_SENT, payload);
  }

  emitOrderPreparing(payload: unknown) {
    this.emit(WS_EVENTS.ORDER_PREPARING, payload);
  }

  emitOrderReady(payload: unknown) {
    this.emit(WS_EVENTS.ORDER_READY, payload);
  }

  emitOrderDelivered(payload: unknown) {
    this.emit(WS_EVENTS.ORDER_DELIVERED, payload);
  }

  emitOrderClosed(payload: unknown) {
    this.emit(WS_EVENTS.ORDER_CLOSED, payload);
  }

  emitPaymentCompleted(payload: unknown) {
    this.emit(WS_EVENTS.PAYMENT_COMPLETED, payload);
  }

  emitTableUpdated(payload: unknown) {
    this.emit(WS_EVENTS.TABLE_UPDATED, payload);
  }
}

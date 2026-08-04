export const WS_EVENTS = {
  ORDER_CREATED: 'order.created',
  ORDER_SENT: 'order.sent',
  ORDER_PREPARING: 'order.preparing',
  ORDER_READY: 'order.ready',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CLOSED: 'order.closed',
  PAYMENT_COMPLETED: 'payment.completed',
  TABLE_UPDATED: 'table.updated',
} as const;

export type WsEvent = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];

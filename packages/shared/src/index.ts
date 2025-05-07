export type OrderCreatedEvent = { orderId: string; items: Array<{ productId: string; quantity: number }> };
export type OrderStatus = "pending" | "reserved" | "failed" | "shipped";

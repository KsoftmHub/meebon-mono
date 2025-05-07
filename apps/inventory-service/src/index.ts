import { Kafka } from 'kafkajs';
import { OrderCreatedEvent } from 'shared';

console.log('Inventory Service Starting...');

// --- Placeholder Kafka Consumer ---
async function startConsumingOrderEvents() {
  console.log('[Inventory Service] Simulating subscribing to OrderCreated events');
  /*
  const kafka = new Kafka({ clientId: 'inventory-service', brokers: ['localhost:9093'] });
  const consumer = kafka.consumer({ groupId: 'inventory-group' });

  await consumer.connect();
  await consumer.subscribe({ topic: 'order-events', fromBeginning: false });

  await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
          if (!message.value) return;
          const event: OrderCreatedEvent = JSON.parse(message.value.toString());
          console.log(`[Inventory Service] Received OrderCreated event: Order ${event.orderId}, Items: ${JSON.stringify(event.items)}`);
          // Implement inventory reservation logic here
          // Then, publish an InventoryReserved event back to Kafka
      },
  });
  */
}

// startConsumingOrderEvents();

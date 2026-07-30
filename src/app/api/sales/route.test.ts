import { GET, POST, PUT } from './route';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Sale from '@/database/models/Sale';

let mongoServer: MongoMemoryServer;

// Start the in-memory MongoDB instance and connect to it
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set the environment variable so connectToDatabase() connects to this instance
  process.env.MONGODB_URI = mongoUri;
  
  await mongoose.connect(mongoUri);
});

// Clean up collections after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Disconnect and stop the server after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Sales API Route', () => {
  
  describe('GET', () => {
    it('should return 200 and an empty array initially', async () => {
      const req = new Request('http://localhost/api/sales');
      const res = await GET(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json).toEqual([]);
    });

    it('should return created sales', async () => {
      await Sale.create({
        invoiceNo: 'REC-123',
        branch: 'Colombo 07',
        cashier: 'Test',
        customer: 'Walk-In',
        orderType: 'Takeaway',
        subtotal: 100,
        discount: 0,
        total: 100,
        paymentMethod: 'Cash',
        items: [],
        status: 'Completed',
        kitchenStatus: 'Pending',
      });

      const req = new Request('http://localhost/api/sales');
      const res = await GET(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json.length).toBe(1);
      expect(json[0].invoiceNo).toBe('REC-123');
    });
    
    it('should filter sales by branch', async () => {
      await Sale.create([
        {
          invoiceNo: 'REC-001', branch: 'Colombo 07', cashier: 'A', customer: 'A', orderType: 'Takeaway', subtotal: 10, total: 10, paymentMethod: 'Cash', items: [], status: 'Completed', kitchenStatus: 'Pending'
        },
        {
          invoiceNo: 'REC-002', branch: 'Kandy', cashier: 'B', customer: 'B', orderType: 'Takeaway', subtotal: 10, total: 10, paymentMethod: 'Cash', items: [], status: 'Completed', kitchenStatus: 'Pending'
        }
      ]);
      
      const req = new Request('http://localhost/api/sales?branch=Kandy');
      const res = await GET(req);
      const json = await res.json();
      
      expect(json.length).toBe(1);
      expect(json[0].branch).toBe('Kandy');
    });
  });

  describe('POST', () => {
    it('should return 400 if no items are provided', async () => {
      const req = new Request('http://localhost/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          branch: 'Colombo 07',
          items: []
        })
      });
      
      const res = await POST(req);
      const json = await res.json();
      
      expect(res.status).toBe(400);
      expect(json.error).toBe('No items in sale');
    });

    it('should create a sale successfully', async () => {
      const req = new Request('http://localhost/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          branch: 'Colombo 07',
          receiptNumber: 'REC-999',
          total: 500,
          items: [
            { productId: 'PROD1', name: 'Juice', quantity: 1, price: 500 }
          ]
        })
      });
      
      const res = await POST(req);
      const json = await res.json();
      
      expect(res.status).toBe(201);
      expect(json.invoiceNo).toBe('REC-999');
      expect(json.total).toBe(500);
      
      // Verify it was saved to the database
      const savedSale = await Sale.findOne({ invoiceNo: 'REC-999' });
      expect(savedSale).not.toBeNull();
      expect(savedSale?.branch).toBe('Colombo 07');
    });
  });
  
  describe('PUT', () => {
    it('should update kitchen status', async () => {
      const sale = await Sale.create({
        invoiceNo: 'REC-PUT',
        branch: 'Colombo 07',
        cashier: 'A',
        customer: 'A',
        orderType: 'Takeaway',
        subtotal: 100,
        total: 100,
        paymentMethod: 'Cash',
        items: [],
        status: 'Completed',
        kitchenStatus: 'Pending'
      });
      
      const req = new Request('http://localhost/api/sales', {
        method: 'PUT',
        body: JSON.stringify({
          id: sale._id,
          kitchenStatus: 'Ready'
        })
      });
      
      const res = await PUT(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json.kitchenStatus).toBe('Ready');
      
      const updatedSale = await Sale.findById(sale._id);
      expect(updatedSale?.kitchenStatus).toBe('Ready');
    });
    
    it('should process a return', async () => {
      const sale = await Sale.create({
        invoiceNo: 'REC-RET',
        branch: 'Colombo 07',
        cashier: 'A',
        customer: 'A',
        orderType: 'Takeaway',
        subtotal: 100,
        total: 100,
        discount: 0,
        paymentMethod: 'Cash',
        items: [{ productId: 'PROD1', name: 'Juice', quantity: 2, basePrice: 50, totalPrice: 100 }],
        status: 'Completed',
        kitchenStatus: 'Pending'
      });
      
      const req = new Request('http://localhost/api/sales', {
        method: 'PUT',
        body: JSON.stringify({
          id: sale._id,
          isReturn: true,
          returnedItems: [
            { productId: 'PROD1', name: 'Juice', quantity: 1, refundAmount: 50, action: 'Waste' }
          ]
        })
      });
      
      const res = await PUT(req);
      const json = await res.json();
      
      expect(res.status).toBe(200);
      expect(json.total).toBe(50); // Original total (100) - refund (50)
      expect(json.status).toBe('Partially Refunded');
    });
  });
});

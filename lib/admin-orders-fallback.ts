export type AdminOrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type AdminPaymentStatus = 'PENDING' | 'FAILED' | 'REFUNDED' | 'PAID';

export type AdminOrderFallback = {
  id: string;
  orderNumber: string;
  amount: number;
  currency?: string;
  status: AdminOrderStatus;
  paymentStatus: AdminPaymentStatus;
  createdAt: string;
  deliveryDate: string;
  requirements: string;
  clientNotes: string;
  providerNotes: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
  };
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string;
  };
  service: {
    id: string;
    title: string;
    category: {
      name: string;
    };
  };
  deliverables: string[];
};

const fallbackOrders: AdminOrderFallback[] = [
  {
    id: 'demo-order-1',
    orderNumber: 'ORD-1001',
    amount: 2500,
    currency: 'USD',
    status: 'IN_PROGRESS',
    paymentStatus: 'PAID',
    createdAt: '2026-03-12T10:00:00.000Z',
    deliveryDate: '2026-03-28T10:00:00.000Z',
    requirements: 'Vreau un website modern pentru afacerea mea, cu accent pe viteza si prezentare premium.',
    clientNotes: 'Prefer culorile albastre si un design minimalist.',
    providerNotes: 'Am inceput lucrul la design. Voi trimite primul draft in 2 zile.',
    client: {
      id: '1',
      firstName: 'Maria',
      lastName: 'Popescu',
      email: 'maria@example.com',
      avatar: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
    provider: {
      id: '2',
      firstName: 'Alexandru',
      lastName: 'Ionescu',
      email: 'alex@example.com',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
    service: {
      id: '1',
      title: 'Dezvoltare Website Modern cu React',
      category: { name: 'Dezvoltare Web' },
    },
    deliverables: ['Design mockup-uri', 'Cod sursa complet', 'Documentatie tehnica'],
  },
  {
    id: 'demo-order-2',
    orderNumber: 'ORD-1002',
    amount: 1800,
    currency: 'USD',
    status: 'PENDING',
    paymentStatus: 'PENDING',
    createdAt: '2026-03-15T14:30:00.000Z',
    deliveryDate: '2026-04-02T14:30:00.000Z',
    requirements: 'Am nevoie de un landing page pentru o campanie noua.',
    clientNotes: 'Sa fie mobile first si usor de editat.',
    providerNotes: 'Astept clarificari finale pentru continut.',
    client: {
      id: '3',
      firstName: 'Andrei',
      lastName: 'Radu',
      email: 'andrei@example.com',
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
    provider: {
      id: '4',
      firstName: 'Elena',
      lastName: 'Dumitrescu',
      email: 'elena@example.com',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
    },
    service: {
      id: '2',
      title: 'Landing Page de conversie',
      category: { name: 'Design & Marketing' },
    },
    deliverables: ['Wireframe', 'Landing page implementat', 'Set livrabile marketing'],
  },
];

export function getAdminOrdersFallback(): AdminOrderFallback[] {
  return fallbackOrders.map((order) => ({
    ...order,
    client: { ...order.client },
    provider: { ...order.provider },
    service: { ...order.service, category: { ...order.service.category } },
    deliverables: [...order.deliverables],
  }));
}

export function getAdminOrderFallbackById(id: string): AdminOrderFallback | null {
  const orders = getAdminOrdersFallback();
  const matched = orders.find((order) => order.id === id);

  if (matched) {
    return matched;
  }

  const first = orders[0];
  if (!first) {
    return null;
  }

  return {
    ...first,
    id,
    orderNumber: first.orderNumber,
  };
}

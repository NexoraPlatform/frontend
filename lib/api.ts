import { ApiClientCore } from './api/core';
import { accountApiMethods, type AccountApiMethods } from './api/domains/account';
import { adminApiMethods, type AdminApiMethods } from './api/domains/admin';
import { catalogApiMethods, type CatalogApiMethods } from './api/domains/catalog';
import { chatApiMethods, type ChatApiMethods } from './api/domains/chat';
import {
  dashboardApiMethods,
  type DashboardApiMethods,
} from './api/domains/dashboard';
import {
  notificationApiMethods,
  type NotificationApiMethods,
} from './api/domains/notifications';
import { paymentApiMethods, type PaymentApiMethods } from './api/domains/payments';
import { projectApiMethods, type ProjectApiMethods } from './api/domains/projects';
import { providerApiMethods, type ProviderApiMethods } from './api/domains/provider';
import { reviewApiMethods, type ReviewApiMethods } from './api/domains/reviews';
import { testsApiMethods, type TestsApiMethods } from './api/domains/tests';

export * from './api/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://Trustorabe.dacars.ro/api';

export interface ApiClient
  extends AccountApiMethods,
    AdminApiMethods,
    CatalogApiMethods,
    ChatApiMethods,
    DashboardApiMethods,
    NotificationApiMethods,
    PaymentApiMethods,
    ProjectApiMethods,
    ProviderApiMethods,
    ReviewApiMethods,
    TestsApiMethods {}

export class ApiClient extends ApiClientCore {}

Object.assign(
  ApiClient.prototype,
  accountApiMethods,
  adminApiMethods,
  catalogApiMethods,
  chatApiMethods,
  dashboardApiMethods,
  notificationApiMethods,
  paymentApiMethods,
  projectApiMethods,
  providerApiMethods,
  reviewApiMethods,
  testsApiMethods
);

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;

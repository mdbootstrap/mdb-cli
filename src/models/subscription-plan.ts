export interface SubscriptionPlanInterface {
    planId?: number;
    planName?: string;
    stripePlanId?: string;
    price?: number;
    bytesContainerRamLimit?: number;
    bytesFtpLimit?: number;
    bytesDatabaseLimit?: number;
    countProjectsLimit?: number;
    countDatabasesLimit?: number;
}

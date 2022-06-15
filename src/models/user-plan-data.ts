import { SubscriptionPlanInterface } from "./subscription-plan";

export interface UserPlanData {
    userPlan: SubscriptionPlanInterface,
    userPermissions: string[],
    projectsCount: number
}
import { createId } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Mirrors the tables Prisma created for the old stuffsdrop repo — same
 * table names ("User", "Item", ...), camelCase columns, enum types, index
 * and foreign-key names — so this points at the existing database with no
 * data migration (a fresh `drizzle-kit push` produces the same DDL Prisma did).
 * Prisma generated ids client-side with cuid(); cuid2 keeps the same text
 * shape. Prisma scalar lists are nullable columns, so array fields here can
 * come back null on old rows — read them through `arr()`.
 *
 * The live database also carries the trust, deposit, subscription and
 * scheduled-drop columns (and the DepositTransaction / SubscriptionEvent
 * tables) from a later version of the app; they're declared here so
 * `drizzle-kit push` never drops them, even though no page uses them yet.
 */

export const userRole = pgEnum("UserRole", ["GIVER", "RECEIVER", "BOTH"]);
export const subscriptionTier = pgEnum("SubscriptionTier", ["FREE", "PRO", "MEMBER"]);
export const depositStatus = pgEnum("DepositStatus", ["NONE", "PENDING", "ACTIVE", "FORFEITED", "WITHDRAWN"]);
export const itemCondition = pgEnum("ItemCondition", ["NEW", "LIKE_NEW", "GOOD", "FAIR"]);
export const itemStatus = pgEnum("ItemStatus", [
  "AVAILABLE",
  "PENDING",
  "CLAIMED",
  "IN_TRANSIT",
  "DELIVERED",
  "DISPUTED",
]);
export const deliveryMethod = pgEnum("DeliveryMethod", [
  "MEETUP",
  "PRIVATE_DISPATCH",
  "WAYBILL",
  "COURIER",
]);

const id = () => text("id").primaryKey().$defaultFn(() => createId());
const createdAt = () =>
  timestamp("createdAt", { precision: 3, mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`);
// Prisma's @updatedAt has no database default; the client sets it on every write.
const updatedAt = () =>
  timestamp("updatedAt", { precision: 3, mode: "date" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdate(() => new Date());

export const users = pgTable(
  "User",
  {
    id: id(),
    supabaseId: text("supabaseId").notNull(),
    email: text("email").notNull(),
    username: text("username").notNull(),
    fullName: text("fullName"),
    avatar: text("avatar"),
    bio: text("bio"),
    location: text("location"),
    role: userRole("role").notNull().default("BOTH"),
    subscriptionTier: subscriptionTier("subscriptionTier").notNull().default("FREE"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    preferredCategories: text("preferredCategories").array(),
    socialLinks: jsonb("socialLinks"),

    // Trust & moderation
    trustScore: integer("trustScore").notNull().default(50),
    totalGiven: integer("totalGiven").notNull().default(0),
    totalReceived: integer("totalReceived").notNull().default(0),
    totalConfirmed: integer("totalConfirmed").notNull().default(0),
    totalDisputes: integer("totalDisputes").notNull().default(0),
    isPhoneVerified: boolean("isPhoneVerified").notNull().default(false),
    isBanned: boolean("isBanned").notNull().default(false),
    banReason: text("banReason"),
    bannedAt: timestamp("bannedAt", { precision: 3, mode: "date" }),

    // Deposit (Paystack)
    depositStatus: depositStatus("depositStatus").notNull().default("NONE"),
    depositAmount: integer("depositAmount").notNull().default(0),
    depositPaidAt: timestamp("depositPaidAt", { precision: 3, mode: "date" }),
    depositRef: text("depositRef"),
    paystackCustomerCode: text("paystackCustomerCode"),

    // Subscription
    subscriptionStatus: text("subscriptionStatus"),
    subscriptionExpiry: timestamp("subscriptionExpiry", { precision: 3, mode: "date" }),
    subscriptionRef: text("subscriptionRef"),
  },
  (t) => [
    uniqueIndex("User_supabaseId_key").on(t.supabaseId),
    uniqueIndex("User_email_key").on(t.email),
    uniqueIndex("User_username_key").on(t.username),
    index("User_isBanned_idx").on(t.isBanned),
    index("User_totalGiven_idx").on(t.totalGiven),
    index("User_trustScore_idx").on(t.trustScore),
  ],
);

export const items = pgTable(
  "Item",
  {
    id: id(),
    title: text("title").notNull(),
    description: text("description"),
    brand: text("brand"),
    size: text("size"),
    category: text("category").notNull(),
    condition: itemCondition("condition").notNull(),
    status: itemStatus("status").notNull().default("AVAILABLE"),
    images: text("images").array(),
    tags: text("tags").array(),
    isExchange: boolean("isExchange").notNull().default(false),
    seekingDescription: text("seekingDescription"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    location: text("location"),
    giverId: text("giverId").notNull(),

    // Value checks
    declaredValue: integer("declaredValue"),
    estimatedValueMin: integer("estimatedValueMin"),
    estimatedValueMax: integer("estimatedValueMax"),
    valueFlagged: boolean("valueFlagged").notNull().default(false),
    valueFlagReason: text("valueFlagReason"),

    // Scheduled drops
    isScheduledDrop: boolean("isScheduledDrop").notNull().default(false),
    scheduledDropAt: timestamp("scheduledDropAt", { precision: 3, mode: "date" }),
    autoFallback: boolean("autoFallback").notNull().default(true),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("Item_giverId_idx").on(t.giverId),
    index("Item_status_isExchange_idx").on(t.status, t.isExchange),
    index("Item_category_idx").on(t.category),
    index("Item_declaredValue_idx").on(t.declaredValue),
    index("Item_scheduledDropAt_idx").on(t.scheduledDropAt),
    foreignKey({ name: "Item_giverId_fkey", columns: [t.giverId], foreignColumns: [users.id] })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ],
);

export const requests = pgTable(
  "Request",
  {
    id: id(),
    message: text("message"),
    status: text("status").notNull().default("PENDING"),
    itemId: text("itemId").notNull(),
    requesterId: text("requesterId").notNull(),
    receiverPhone: text("receiverPhone"),
    receiverEmail: text("receiverEmail"),
    receiverAddress: text("receiverAddress"),
    deliveryStatus: text("deliveryStatus"),
    deliveryMethod: deliveryMethod("deliveryMethod"),
    deliveryOtp: text("deliveryOtp"),
    otpVerifiedAt: timestamp("otpVerifiedAt", { precision: 3, mode: "date" }),
    waybillReceiptUrl: text("waybillReceiptUrl"),
    parkLocation: text("parkLocation"),
    trackingNumber: text("trackingNumber"),
    courierName: text("courierName"),
    dispatchName: text("dispatchName"),
    dispatchPhone: text("dispatchPhone"),
    disputeReason: text("disputeReason"),
    disputePhotos: text("disputePhotos").array(),
    disputeResolvedAt: timestamp("disputeResolvedAt", { precision: 3, mode: "date" }),
    dispatchedAt: timestamp("dispatchedAt", { precision: 3, mode: "date" }),
    deliveredAt: timestamp("deliveredAt", { precision: 3, mode: "date" }),
    dispatchProofUrl: text("dispatchProofUrl"),

    // Receipt confirmation
    confirmDeadline: timestamp("confirmDeadline", { precision: 3, mode: "date" }),
    autoConfirmed: boolean("autoConfirmed").notNull().default(false),
    disputeResolution: text("disputeResolution"),

    // Stake (Paystack)
    stakeAmount: integer("stakeAmount"),
    stakeRef: text("stakeRef"),
    stakeStatus: text("stakeStatus"),

    createdAt: createdAt(),
    // Unlike User/Item, this column has a database default.
    updatedAt: timestamp("updatedAt", { precision: 3, mode: "date" })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("Request_confirmDeadline_idx").on(t.confirmDeadline),
    index("Request_deliveryStatus_idx").on(t.deliveryStatus),
    index("Request_status_idx").on(t.status),
    foreignKey({ name: "Request_itemId_fkey", columns: [t.itemId], foreignColumns: [items.id] })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({ name: "Request_requesterId_fkey", columns: [t.requesterId], foreignColumns: [users.id] })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ],
);

export const wishes = pgTable(
  "Wish",
  {
    id: id(),
    request: text("request").notNull(),
    category: text("category"),
    bounty: text("bounty"),
    urgency: text("urgency").notNull().default("normal"),
    isAnon: boolean("isAnon").notNull().default(false),
    userId: text("userId").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("Wish_createdAt_idx").on(t.createdAt.desc().nullsFirst()),
    foreignKey({ name: "Wish_userId_fkey", columns: [t.userId], foreignColumns: [users.id] })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ],
);

export const savedItems = pgTable(
  "SavedItem",
  {
    id: id(),
    savedAt: timestamp("savedAt", { precision: 3, mode: "date" }).notNull().default(sql`CURRENT_TIMESTAMP`),
    userId: text("userId").notNull(),
    itemId: text("itemId").notNull(),
  },
  (t) => [
    uniqueIndex("SavedItem_userId_itemId_key").on(t.userId, t.itemId),
    index("SavedItem_userId_idx").on(t.userId),
    foreignKey({ name: "SavedItem_userId_fkey", columns: [t.userId], foreignColumns: [users.id] })
      .onDelete("restrict")
      .onUpdate("cascade"),
    foreignKey({ name: "SavedItem_itemId_fkey", columns: [t.itemId], foreignColumns: [items.id] })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ],
);

export const comments = pgTable(
  "Comment",
  {
    id: id(),
    text: text("text").notNull(),
    createdAt: createdAt(),
    userId: text("userId").notNull(),
    itemId: text("itemId").notNull(),
  },
  (t) => [
    index("Comment_itemId_idx").on(t.itemId),
    index("Comment_createdAt_idx").on(t.createdAt),
    foreignKey({ name: "Comment_userId_fkey", columns: [t.userId], foreignColumns: [users.id] })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({ name: "Comment_itemId_fkey", columns: [t.itemId], foreignColumns: [items.id] })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const notifications = pgTable(
  "Notification",
  {
    id: id(),
    message: text("message").notNull(),
    type: text("type").notNull(),
    isRead: boolean("isRead").notNull().default(false),
    createdAt: createdAt(),
    userId: text("userId").notNull(),
    actorId: text("actorId"),
    itemId: text("itemId"),
    requestId: text("requestId"),
  },
  (t) => [
    index("Notification_userId_idx").on(t.userId),
    index("Notification_createdAt_idx").on(t.createdAt),
    index("Notification_isRead_idx").on(t.isRead),
    foreignKey({ name: "Notification_userId_fkey", columns: [t.userId], foreignColumns: [users.id] })
      .onDelete("cascade")
      .onUpdate("cascade"),
    foreignKey({ name: "Notification_actorId_fkey", columns: [t.actorId], foreignColumns: [users.id] })
      .onDelete("set null")
      .onUpdate("cascade"),
    foreignKey({ name: "Notification_itemId_fkey", columns: [t.itemId], foreignColumns: [items.id] })
      .onDelete("cascade")
      .onUpdate("cascade"),
  ],
);

export const depositTransactions = pgTable(
  "DepositTransaction",
  {
    id: id(),
    userId: text("userId").notNull(),
    type: text("type").notNull(),
    amount: integer("amount").notNull(),
    reference: text("reference").notNull(),
    requestId: text("requestId"),
    status: text("status").notNull(),
    note: text("note"),
    createdAt: createdAt(),
  },
  (t) => [
    index("DepositTransaction_reference_idx").on(t.reference),
    index("DepositTransaction_requestId_idx").on(t.requestId),
    index("DepositTransaction_userId_idx").on(t.userId),
    foreignKey({ name: "DepositTransaction_userId_fkey", columns: [t.userId], foreignColumns: [users.id] })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ],
);

export const subscriptionEvents = pgTable(
  "SubscriptionEvent",
  {
    id: id(),
    userId: text("userId").notNull(),
    event: text("event").notNull(),
    tier: text("tier").notNull(),
    amount: integer("amount"),
    reference: text("reference"),
    createdAt: createdAt(),
  },
  (t) => [
    index("SubscriptionEvent_userId_idx").on(t.userId),
    foreignKey({ name: "SubscriptionEvent_userId_fkey", columns: [t.userId], foreignColumns: [users.id] })
      .onDelete("restrict")
      .onUpdate("cascade"),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  itemsListed: many(items),
  itemsRequested: many(requests),
  wishes: many(wishes),
  savedItems: many(savedItems),
  comments: many(comments),
  notifications: many(notifications, { relationName: "recipient" }),
  actorNotifications: many(notifications, { relationName: "actor" }),
  depositTransactions: many(depositTransactions),
  subscriptionEvents: many(subscriptionEvents),
}));

export const depositTransactionsRelations = relations(depositTransactions, ({ one }) => ({
  user: one(users, { fields: [depositTransactions.userId], references: [users.id] }),
}));

export const subscriptionEventsRelations = relations(subscriptionEvents, ({ one }) => ({
  user: one(users, { fields: [subscriptionEvents.userId], references: [users.id] }),
}));

export const itemsRelations = relations(items, ({ one, many }) => ({
  giver: one(users, { fields: [items.giverId], references: [users.id] }),
  requests: many(requests),
  savedBy: many(savedItems),
  comments: many(comments),
  notifications: many(notifications),
}));

export const requestsRelations = relations(requests, ({ one }) => ({
  item: one(items, { fields: [requests.itemId], references: [items.id] }),
  requester: one(users, { fields: [requests.requesterId], references: [users.id] }),
}));

export const wishesRelations = relations(wishes, ({ one }) => ({
  user: one(users, { fields: [wishes.userId], references: [users.id] }),
}));

export const savedItemsRelations = relations(savedItems, ({ one }) => ({
  user: one(users, { fields: [savedItems.userId], references: [users.id] }),
  item: one(items, { fields: [savedItems.itemId], references: [items.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  item: one(items, { fields: [comments.itemId], references: [items.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id], relationName: "recipient" }),
  actor: one(users, { fields: [notifications.actorId], references: [users.id], relationName: "actor" }),
  item: one(items, { fields: [notifications.itemId], references: [items.id] }),
}));

export type User = typeof users.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Request = typeof requests.$inferSelect;
export type UserRole = (typeof userRole.enumValues)[number];
export type ItemCondition = (typeof itemCondition.enumValues)[number];
export type ItemStatus = (typeof itemStatus.enumValues)[number];
export type DeliveryMethod = (typeof deliveryMethod.enumValues)[number];

/** Prisma list columns are nullable in the database; treat null as empty. */
export function arr<T>(value: T[] | null | undefined): T[] {
  return value ?? [];
}

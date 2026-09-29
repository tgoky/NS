import { createId } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  foreignKey,
  index,
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
 */

export const userRole = pgEnum("UserRole", ["GIVER", "RECEIVER", "BOTH"]);
export const subscriptionTier = pgEnum("SubscriptionTier", ["FREE", "PRO"]);
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
  },
  (t) => [
    uniqueIndex("User_supabaseId_key").on(t.supabaseId),
    uniqueIndex("User_email_key").on(t.email),
    uniqueIndex("User_username_key").on(t.username),
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
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("Item_giverId_idx").on(t.giverId),
    index("Item_status_isExchange_idx").on(t.status, t.isExchange),
    index("Item_category_idx").on(t.category),
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
    createdAt: createdAt(),
  },
  (t) => [
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

export const usersRelations = relations(users, ({ many }) => ({
  itemsListed: many(items),
  itemsRequested: many(requests),
  wishes: many(wishes),
  savedItems: many(savedItems),
  comments: many(comments),
  notifications: many(notifications, { relationName: "recipient" }),
  actorNotifications: many(notifications, { relationName: "actor" }),
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

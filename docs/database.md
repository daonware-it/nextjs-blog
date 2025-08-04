# 🗂️ Datenbankstruktur (Prisman)

Die Datenbank basiert auf **Prisma ORM** und verwendet PostgreSQL. Die aktuelle Struktur umfasst folgende Hauptmodelle.

---

### 📦 Übersicht

- `User`
- `Category`
- `BlockDraftReport`
- `BlockDraftCommentReport`
- `BlockDraftLike`
- `BlockDraftCommentLike`
- `BlockDraftComment`
- `Newsletter`
- `AiRequest`
- `SubscriptionPlan`
- `UserSubscription`
- `UsernameHistory`
- `EmailHistory`
- `Post`
- `BlockDraft`
- `Notification`
- `AuditLog`

---

### 🧑‍💻 User

```prisma
model User {
  id                     Int                     @id @default(autoincrement())
  email                  String                  @unique
  password               String
  name                   String?
  permissions            String[]                @default([])
  username               String?                 @unique
  createdAt              DateTime                @default(now())
  lastEmailChange        DateTime?
  lastUsernameChange     DateTime?
  avatarUrl              String?
  updatedAt              DateTime                @default(now()) @updatedAt
  role                   String                  @default("LESER")
  twoFactorEnabled       Boolean                 @default(false)
  twoFactorSecret        String?
  status                 String                  @default("ACTIVE")
  aiRequests             AiRequest[]
  adminAuditLogs         AuditLog[]              @relation("AdminAuditLogs")
  auditLogs              AuditLog[]              @relation("UserAuditLogs")
  blockDraftsAsCoAuthor  BlockDraft[]            @relation("BlockDraftCoAuthor")
  blockDrafts            BlockDraft[]
  blockDraftLikes        BlockDraftLike[]        @relation("UserBlockDraftLikes")
  blockDraftComments     BlockDraftComment[]     @relation("UserBlockDraftComments")
  emailHistory           EmailHistory[]
  notifications          Notification[]
  posts                  Post[]
  subscriptions          UserSubscription[]
  usernameHistory        UsernameHistory[]
  newsletters            Newsletter[]            @relation("NewsletterToUser")
  blockDraftCommentLikes BlockDraftCommentLike[] @relation("UserBlockDraftCommentLikes")
}
```
---

### 🗂️ Category

```prisma
model Category {
  id          Int          @id @default(autoincrement())
  name        String       @unique
  slug        String       @unique
  description String?
  color       String?      @default("#3b82f6")
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  parentId    Int?
  parent      Category?    @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[]   @relation("CategoryHierarchy")
  posts       Post[]       @relation("PostToCategory")
  blockDrafts BlockDraft[]
}
```

---

### 📝 BlockDraftReport

```prisma
model BlockDraftReport {
  id           Int        @id @default(autoincrement())
  blockDraftId Int
  reason       String
  createdAt    DateTime   @default(now())
  blockDraft   BlockDraft @relation("BlockDraftToReport", fields: [blockDraftId], references: [id])
}
```

---

### 📝 BlockDraftCommentReport

```prisma
model BlockDraftCommentReport {
  id        Int               @id @default(autoincrement())
  commentId Int
  reason    String
  createdAt DateTime          @default(now())
  comment   BlockDraftComment @relation("BlockDraftCommentToReport", fields: [commentId], references: [id])
}
```

---

### 👍 BlockDraftLike

```prisma
model BlockDraftLike {
  id           Int        @id @default(autoincrement())
  userId       Int
  blockDraftId Int
  createdAt    DateTime   @default(now())
  ip           String?    @db.VarChar(64)
  user         User       @relation("UserBlockDraftLikes", fields: [userId], references: [id])
  blockDraft   BlockDraft @relation("BlockDraftLikes", fields: [blockDraftId], references: [id])

  @@unique([userId, blockDraftId])
}
```

---

### 👍 BlockDraftCommentLike

```prisma
model BlockDraftCommentLike {
  id        Int               @id @default(autoincrement())
  userId    Int
  commentId Int
  createdAt DateTime          @default(now())
  ip        String?           @db.VarChar(64)
  user      User              @relation("UserBlockDraftCommentLikes", fields: [userId], references: [id])
  comment   BlockDraftComment @relation("BlockDraftCommentLikes", fields: [commentId], references: [id])

  @@unique([userId, commentId])
}
```

---

### 💬 BlockDraftComment

```prisma
model BlockDraftComment {
  id                       Int                       @id @default(autoincrement())
  userId                   Int
  blockDraftId             Int
  content                  String
  createdAt                DateTime                  @default(now())
  user                     User                      @relation("UserBlockDraftComments", fields: [userId], references: [id])
  blockDraft               BlockDraft                @relation("BlockDraftComments", fields: [blockDraftId], references: [id])
  blockDraftCommentReports BlockDraftCommentReport[] @relation("BlockDraftCommentToReport")
  likes                    BlockDraftCommentLike[]   @relation("BlockDraftCommentLikes")
  parentCommentId          Int?
  parent                   BlockDraftComment?        @relation("BlockDraftCommentReplies", fields: [parentCommentId], references: [id])
  replies                  BlockDraftComment[]       @relation("BlockDraftCommentReplies")
}
```

---

### 📰 Newsletter

```prisma
model Newsletter {
  id    Int    @id @default(autoincrement())
  title String
  users User[] @relation("NewsletterToUser")
}
```

---

### 🤖 AiRequest

```prisma
model AiRequest {
  id        Int      @id @default(autoincrement())
  userId    Int
  prompt    String
  result    String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

---

### 💳 SubscriptionPlan

```prisma
model SubscriptionPlan {
  id                    Int                @id @default(autoincrement())
  name                  String             @unique
  price                 Float
  includedRequests      Int
  extraPricePerThousand Float?
  description           String?
  userSubscriptions     UserSubscription[]
}
```

---

### 💳 UserSubscription

```prisma
model UserSubscription {
  id               Int              @id @default(autoincrement())
  userId           Int
  planId           Int
  startedAt        DateTime         @default(now())
  expiresAt        DateTime?
  isActive         Boolean          @default(true)
  includedRequests Int?
  tokensBlocked    Boolean          @default(false)
  plan             SubscriptionPlan @relation(fields: [planId], references: [id])
  user             User             @relation(fields: [userId], references: [id])
}
```

---

### 🕓 UsernameHistory

```prisma
model UsernameHistory {
  id          Int      @id @default(autoincrement())
  userId      Int
  oldUsername String
  newUsername String
  changedAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
}
```

---

### 📧 EmailHistory

```prisma
model EmailHistory {
  id        Int      @id @default(autoincrement())
  userId    Int
  oldEmail  String
  newEmail  String
  changedAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

---

### 📝 Post

```prisma
model Post {
  id         Int        @id @default(autoincrement())
  title      String
  content    String
  published  Boolean    @default(false)
  publishAt  DateTime?
  authorId   Int?
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  author     User?      @relation(fields: [authorId], references: [id])
  categories Category[] @relation("PostToCategory")
}
```

---

### 📝 BlockDraft

```prisma
model BlockDraft {
  blockDraftReports BlockDraftReport[]  @relation("BlockDraftToReport")
  id                Int                 @id @default(autoincrement())
  userId            Int
  blocks            Json
  updatedAt         DateTime            @default(now()) @updatedAt
  deleteAt          DateTime?
  description       String?
  title             String?
  coAuthorId        Int?
  status            BlockDraftStatus    @default(ENTWURF)
  locked            Boolean             @default(false)
  categoryId        Int?
  category          Category?           @relation(fields: [categoryId], references: [id])
  coAuthor          User?               @relation("BlockDraftCoAuthor", fields: [coAuthorId], references: [id])
  user              User                @relation(fields: [userId], references: [id])
  likes             BlockDraftLike[]    @relation("BlockDraftLikes")
  comments          BlockDraftComment[] @relation("BlockDraftComments")
}
```

---

### 🔔 Notification

```prisma
model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int
  message   String
  type      String   @default("info")
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}
```

---

### 📝 AuditLog

```prisma
model AuditLog {
  id        Int         @id @default(autoincrement())
  userId    Int
  adminId   Int?
  action    AuditAction
  details   String
  oldValue  String?
  newValue  String?
  createdAt DateTime    @default(now())
  admin     User?       @relation("AdminAuditLogs", fields: [adminId], references: [id])
  user      User        @relation("UserAuditLogs", fields: [userId], references: [id])
}
```



-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL DEFAULT '',
    "invitedUsers" INTEGER NOT NULL DEFAULT 0,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "lastBonusDate" DATETIME NOT NULL,
    "accountNumber" TEXT NOT NULL DEFAULT '',
    "lastUsed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hasWithdrawn" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Idle'
);
INSERT INTO "new_User" ("accountNumber", "amount", "id", "invitedUsers", "lastBonusDate", "lastUsed", "status", "userId", "userName") SELECT "accountNumber", "amount", "id", "invitedUsers", "lastBonusDate", "lastUsed", "status", "userId", "userName" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

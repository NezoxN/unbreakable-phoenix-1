-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "faceitId" TEXT NOT NULL,
    "faceitNickname" TEXT NOT NULL,
    "avatar" TEXT,
    "faceitLevel" INTEGER NOT NULL DEFAULT 0,
    "faceitElo" INTEGER NOT NULL DEFAULT 0,
    "faceitKd" REAL NOT NULL DEFAULT 0,
    "faceitWinrate" INTEGER NOT NULL DEFAULT 0,
    "faceitHsPercent" INTEGER NOT NULL DEFAULT 0,
    "faceitMatches" INTEGER NOT NULL DEFAULT 0,
    "faceitSyncedAt" DATETIME,
    "fullName" TEXT,
    "telegram" TEXT,
    "role" TEXT,
    "universityId" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'NONE',
    "studentEmail" TEXT,
    "verifiedAt" DATETIME,
    "discordId" TEXT,
    "discordUsername" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("avatar", "createdAt", "discordId", "discordUsername", "faceitElo", "faceitId", "faceitKd", "faceitLevel", "faceitNickname", "faceitSyncedAt", "faceitWinrate", "fullName", "id", "isAdmin", "role", "studentEmail", "telegram", "universityId", "updatedAt", "verificationStatus", "verifiedAt") SELECT "avatar", "createdAt", "discordId", "discordUsername", "faceitElo", "faceitId", "faceitKd", "faceitLevel", "faceitNickname", "faceitSyncedAt", "faceitWinrate", "fullName", "id", "isAdmin", "role", "studentEmail", "telegram", "universityId", "updatedAt", "verificationStatus", "verifiedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_faceitId_key" ON "User"("faceitId");
CREATE UNIQUE INDEX "User_discordId_key" ON "User"("discordId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

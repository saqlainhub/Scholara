-- CreateTable
CREATE TABLE "TaskSubmissionVoiceNote" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "duration" INTEGER,
    "bytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskSubmissionVoiceNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskSubmissionVoiceNote_submissionId_idx" ON "TaskSubmissionVoiceNote"("submissionId");

-- CreateIndex
CREATE INDEX "TaskSubmissionVoiceNote_createdAt_idx" ON "TaskSubmissionVoiceNote"("createdAt");

-- AddForeignKey
ALTER TABLE "TaskSubmissionVoiceNote" ADD CONSTRAINT "TaskSubmissionVoiceNote_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "TaskSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

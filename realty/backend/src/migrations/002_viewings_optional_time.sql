-- Make viewings.scheduled_at optional. The booking flow no longer asks the
-- client for a preferred time — the realtor calls them to arrange it.
ALTER TABLE viewings ALTER COLUMN scheduled_at DROP NOT NULL;

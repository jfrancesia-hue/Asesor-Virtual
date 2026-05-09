-- ============================================================
-- Migration 007: agregar valor free al enum de planes
-- ============================================================

ALTER TYPE plan_type ADD VALUE IF NOT EXISTS 'free' BEFORE 'start';

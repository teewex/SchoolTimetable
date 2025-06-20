# EduScheduler - School Timetable Management System

## Overview

EduScheduler is a comprehensive school timetable management system built as a full-stack web application. It enables educational institutions to efficiently manage classes, subjects, teachers, rooms, and automatically generate optimized timetables. The system provides a modern, responsive interface for creating and viewing schedules with conflict detection and export capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for RESTful API
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Schema Validation**: Zod for runtime type checking
- **Development**: tsx for TypeScript execution in development

### Build and Deployment
- **Development**: Hot module replacement with Vite
- **Production**: Static frontend served by Express server
- **Bundling**: ESBuild for server-side code bundling
- **Deployment**: Configured for Replit autoscale deployment

## Key Components

### Data Models
- **Classes**: Student groups with level, section, and capacity management
- **Subjects**: Course definitions with weekly hours and lab requirements
- **Teachers**: Staff with availability constraints and workload limits
- **Rooms**: Physical spaces with type classifications and capacity
- **Time Periods**: Configurable schedule slots with day/time definitions
- **Timetable Entries**: Generated schedule assignments linking all entities

### Core Services
- **Scheduling Engine**: Advanced algorithm for automatic timetable generation with conflict resolution
- **Export Services**: PDF and Excel export functionality for generated schedules
- **Storage Layer**: Abstracted database operations with type-safe queries

### User Interface
- **Dashboard**: Overview with statistics and quick actions
- **Entity Management**: CRUD operations for classes, subjects, teachers, and rooms
- **Schedule Generation**: Interactive wizard with optimization options
- **Timetable Viewer**: Multi-view display (class, teacher, overview) with filtering
- **Settings**: System configuration for academic terms and constraints

## Data Flow

1. **Setup Phase**: Users configure classes, subjects, teachers, and rooms through dedicated management interfaces
2. **Assignment Phase**: Teachers are assigned to subjects, subjects to classes, and time periods are defined
3. **Generation Phase**: Scheduling engine processes constraints and generates optimized timetable
4. **Review Phase**: Generated schedules are presented with conflict analysis and statistics
5. **Export Phase**: Final timetables can be exported in multiple formats for distribution

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Headless UI components for accessibility
- **react-hook-form**: Form state management and validation
- **zod**: Runtime type validation and schema definition

### Development Dependencies
- **tsx**: TypeScript execution for development
- **vite**: Frontend build tool and development server
- **tailwindcss**: Utility-first CSS framework
- **@replit/vite-plugin-***: Replit-specific development plugins

## Deployment Strategy

### Development Environment
- **Command**: `npm run dev` starts both frontend (Vite) and backend (Express) in parallel
- **Hot Reload**: Vite provides instant frontend updates
- **Database**: Connected to Neon PostgreSQL via DATABASE_URL environment variable
- **Port**: Application runs on port 5000 with Vite dev server integration

### Production Environment
- **Build Process**: 
  1. Frontend built with `vite build` to static assets
  2. Backend bundled with `esbuild` for optimized Node.js execution
- **Serving**: Express server serves both API routes and static frontend
- **Database**: Production PostgreSQL connection via DATABASE_URL
- **Deployment**: Configured for Replit's autoscale infrastructure

### Database Management
- **Migrations**: Drizzle migrations stored in `/migrations` directory
- **Schema**: Centralized schema definition in `/shared/schema.ts`
- **Push Command**: `npm run db:push` applies schema changes directly

## Changelog

```
Changelog:
- June 19, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
# Video Streaming Platform - System Architecture

## 🏗️ Architecture Overview

This document outlines the system architecture for the efficient video streaming platform, designed for scalability with user isolation through session-based management and optimized for resource-constrained hardware.

---

## 🎯 Architecture Principles

### Core Design Goals

- **Efficient Resource Usage**: Maximum performance from limited hardware
- **Fast Response Times**: Instant streaming without container startup delays
- **User Isolation**: Session-based isolation without dedicated containers
- **Scalability**: Horizontal scaling when needed, efficient when small
- **Maintainability**: Simple, maintainable architecture

### Design Patterns (Revised)

- **Shared Service Architecture**: Single streaming service handles all users
- **Session-Based Isolation**: User isolation through application logic
- **Worker Pool Pattern**: Background workers for video processing
- **Circuit Breaker**: Prevent cascade failures under load
- **Resource Pooling**: Shared resources with fair allocation

---

## 🏢 Optimized System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Web Browser  │  Mobile App  │  Smart TV  │  Media Player      │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                        REVERSE PROXY                           │
├─────────────────────────────────────────────────────────────────┤
│                         Nginx/Traefik                          │
│              (SSL Termination, Load Balancing)                 │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                  SINGLE APPLICATION LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│              Main NestJS Streaming Application                 │
│         (Authentication, Multi-User Streaming Service)         │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐   │
│  │   Auth      │ │  Streaming  │ │    Background Workers   │   │
│  │  Service    │ │   Service   │ │   (Video Processing)    │   │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                       STORAGE LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Video Files (SSD)  │  Database  │  Cache (Redis)  │  Logs     │
└─────────────────────────────────────────────────────────────────┘
```

### Resource Efficiency Benefits

**Memory Usage Comparison:**

- **Container-per-User**: 512MB × 5 users = 2.5GB
- **Shared Service**: 200MB base + 50MB per active stream = 450MB total
- **Savings**: 80% less memory usage

**Response Time Comparison:**

- **Container-per-User**: 5-10 seconds (container startup)
- **Shared Service**: <100ms (session lookup)
- **Improvement**: 50-100x faster response

---

## 🚀 Efficient Alternative Architectures

### Option 1: Single Application with Session Isolation (Recommended)

**Architecture:**

```typescript
@Controller('stream')
export class OptimizedStreamingController {
  private activeStreams = new Map<string, StreamSession>();
  private readonly maxConcurrentStreams = 8;

  @Get('video/:filename')
  async streamVideo(
    @Param('filename') filename: string,
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: User,
  ) {
    // Check concurrent streams limit
    if (this.activeStreams.size >= this.maxConcurrentStreams) {
      throw new HttpException('Server busy', HttpStatus.TOO_MANY_REQUESTS);
    }

    // Create user session
    const sessionId = `${user.id}_${Date.now()}`;
    const session = new StreamSession(user, filename, sessionId);

    // Track active stream
    this.activeStreams.set(sessionId, session);

    try {
      // Your existing streaming logic here
      await this.handleVideoStream(filename, req, res, session);
    } finally {
      // Cleanup session
      this.activeStreams.delete(sessionId);
    }
  }
}
```

**Benefits:**

- **Instant response**: No container startup delay
- **Memory efficient**: ~300MB total vs 2.5GB with containers
- **Simple deployment**: Single application to manage
- **Easy debugging**: All logs in one place

### Option 2: Worker Pool Pattern

**Architecture:**

```typescript
class StreamingWorkerPool {
  private workers: Worker[] = [];
  private readonly poolSize = 3; // Based on CPU cores

  constructor() {
    // Pre-create worker threads
    for (let i = 0; i < this.poolSize; i++) {
      this.workers.push(new Worker('./streaming-worker.js'));
    }
  }

  async assignStreamingTask(user: User, videoPath: string, range: string) {
    // Find available worker
    const worker = this.getAvailableWorker();

    // Delegate streaming task
    return worker.handleStream({
      userId: user.id,
      videoPath,
      range,
      userPreferences: user.streamingPrefs,
    });
  }
}
```

**Benefits:**

- **CPU efficiency**: Utilizes multiple cores
- **Isolation**: Worker crashes don't affect main app
- **Scalable**: Can adjust worker count based on load

### Option 3: Hybrid Container Approach (Future Scaling)

**When to use containers:**

- Only create containers for heavy processing (transcoding)
- Use shared streaming service for regular video serving
- Scale containers based on actual demand, not user count

**Smart Container Strategy:**

```typescript
class SmartContainerManager {
  async handleStreamRequest(user: User, video: Video) {
    // Check if video needs transcoding
    if (this.needsTranscoding(video, user.device)) {
      // Create temporary processing container
      return this.createTranscodingContainer(video, user);
    } else {
      // Use shared streaming service
      return this.streamingService.serveVideo(video, user);
    }
  }

  private needsTranscoding(video: Video, device: Device): boolean {
    // Only transcode when necessary
    return (
      video.codec !== device.supportedCodec ||
      video.resolution > device.maxResolution
    );
  }
}
```

**Resource Usage for Your Hardware:**

- **Shared Service**: 200-400MB RAM, handles 5-8 concurrent streams
- **Smart Containers**: Create only when needed for transcoding
- **Total Memory**: ~600MB vs 2.5GB with per-user containers

---

## 🎯 Recommended Architecture for Your Setup

### Phase 1: Optimized Single Application (Immediate)

```typescript
// Enhanced version of your current streaming controller
@Injectable()
export class StreamingService {
  private activeStreams = new Map<string, ActiveStream>();
  private userSessions = new Map<string, UserSession>();

  async streamVideo(user: User, filename: string, req: Request, res: Response) {
    // Session-based isolation instead of containers
    const session = this.getUserSession(user.id);

    // Apply user-specific settings
    const streamConfig = {
      quality: session.preferredQuality,
      startPosition: session.lastWatchPosition,
      bandwidth: session.estimatedBandwidth,
    };

    // Your existing streaming logic with user context
    return this.handleStream(filename, req, res, streamConfig);
  }
}
```

### Phase 2: Add Worker Pool (When Needed)

- Add worker threads for CPU-intensive operations
- Keep main thread responsive for new requests
- Implement when concurrent users exceed 3-4

### Phase 3: Smart Container Strategy (Future Growth)

- Containers only for transcoding/heavy processing
- Shared streaming service for standard video delivery
- Auto-scaling based on actual workload

---

---

## 🔄 Request Flow Architecture

---

## � Request Flow Architecture

### Single Application Multi-User Pattern

The platform uses an **efficient single-application** architecture where one NestJS application handles all users through session-based isolation.

#### Streamlined Request Flow

```
Client Request → Authentication → Session Management → Video Stream Response
```

### Step-by-Step Request Processing

#### 1. Client Video Request

```http
GET http://server-laptop:3000/api/stream/video/movie123.mp4
Authorization: Bearer jwt_token_here
Range: bytes=0-1048575
```

#### 2. Main Application Processing

**Authentication & Session Management:**

```typescript
@Controller('api/stream')
export class OptimizedStreamController {
  private activeStreams = new Map<string, StreamSession>();

  @Get('video/:filename')
  async streamVideo(
    @Param('filename') filename: string,
    @Req() req: Request,
    @Res() res: Response,
    @CurrentUser() user: User,
  ) {
    // 1. Check concurrent streams limit
    if (this.activeStreams.size >= this.maxConcurrentStreams) {
      throw new HttpException('Server busy', HttpStatus.TOO_MANY_REQUESTS);
    }

    // 2. Create user session
    const sessionId = `${user.id}_${Date.now()}`;
    const session = new StreamSession(user, filename, sessionId);

    // 3. Track active stream
    this.activeStreams.set(sessionId, session);

    try {
      // 4. Stream video directly with session context
      await this.handleVideoStream(filename, req, res, session);
    } finally {
      // 5. Cleanup session
      this.activeStreams.delete(sessionId);
    }
  }
}
```

#### 3. Direct Video Stream Processing

**Enhanced Streaming Service with Session Context:**

```typescript
class StreamingService {
  async handleVideoStream(
    filename: string,
    req: Request,
    res: Response,
    session: StreamSession,
  ) {
    const videoPath = join(this.videosPath, filename);

    // Apply user-specific settings from session
    const userPrefs = session.user.streamingPreferences;

    // Enhanced range request handling
    const range = req.headers.range;
    const stats = await stat(videoPath);

    // Log user activity for session tracking
    this.logStreamActivity(session, filename, range);

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

      const videoStream = createReadStream(videoPath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': end - start + 1,
        'Content-Type': 'video/mp4',
      });

      // Track stream in session
      session.updateActivity('streaming', { start, end, filename });

      videoStream.pipe(res);
    } else {
      // Serve entire file for clients that don't support range requests
      res.writeHead(200, {
        'Content-Length': stats.size,
        'Content-Type': 'video/mp4',
      });

      const videoStream = createReadStream(videoPath);
      session.updateActivity('streaming', { filename, fullFile: true });
      videoStream.pipe(res);
    }
  }
}
```

### Session Lifecycle Management

#### Session Creation and Management Flow

```typescript
class SessionService {
  private activeSessions = new Map<string, UserSession>();
  private readonly maxConcurrentSessions = 8;

  async createUserSession(user: User): Promise<UserSession> {
    // 1. Check existing session
    let session = this.activeSessions.get(user.id);

    if (!session) {
      // 2. Create new session
      session = new UserSession({
        userId: user.id,
        sessionId: `${user.id}_${Date.now()}`,
        preferences: user.streamingPreferences,
        startTime: new Date(),
        lastActivity: new Date(),
      });

      this.activeSessions.set(user.id, session);
    }

    // 3. Update activity tracking
    session.updateLastActivity();

    return session;
  }

  async cleanupInactiveSessions(): Promise<void> {
    const now = new Date();
    const inactivityTimeout = 30 * 60 * 1000; // 30 minutes

    for (const [userId, session] of this.activeSessions) {
      if (now.getTime() - session.lastActivity.getTime() > inactivityTimeout) {
        this.activeSessions.delete(userId);
        await this.logSessionEnd(session);
      }
    }
  }
}
```

### Optimized Network Architecture

#### Client to Application Server

```
Direct HTTP Request (No Container Overhead)
┌─────────┐    HTTP     ┌─────────────────────┐
│ Browser │ ────────── │ NestJS Application  │
│         │             │    (Port 3000)      │
└─────────┘             └─────────────────────┘
```

#### Simplified Video Data Flow

```
Direct File Access → Application Processing → Client
┌─────────┐    ┌─────────────────┐    ┌─────────┐
│ SSD     │───▶│ NestJS Streaming │───▶│ Browser │
│ Videos  │    │    Service       │    │ Player  │
└─────────┘    └─────────────────┘    └─────────┘
```

#### Session-Based User Isolation

```
Single Application with Multiple User Sessions
┌─────────────────────────────────────────────────┐
│           NestJS Streaming Application          │
├─────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │  User A  │ │  User B  │ │  User C  │        │
│  │ Session  │ │ Session  │ │ Session  │        │
│  └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────┤
│         Shared Video Streaming Service         │
└─────────────────────────────────────────────────┘
```

### Session Management Structure

The application manages multiple user sessions within a single process:

```
Session Management Architecture:
┌─────────────────────────────────────────────────┐
│            NestJS Application                   │
├─────────────────────────────────────────────────┤
│  Session Store (In-Memory Map)                  │
│  ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │   User A    │ │   User B    │ │  User C   │ │
│  │ SessionID:  │ │ SessionID:  │ │SessionID: │ │
│  │ user_a_123  │ │ user_b_456  │ │user_c_789 │ │
│  │             │ │             │ │           │ │
│  │ • StreamID  │ │ • StreamID  │ │• StreamID │ │
│  │ • UserPrefs │ │ • UserPrefs │ │• UserPrefs│ │
│  │ • Activity  │ │ • Activity  │ │• Activity │ │
│  └─────────────┘ └─────────────┘ └───────────┘ │
├─────────────────────────────────────────────────┤
│          Shared Streaming Service               │
│  ┌─────────────────────────────────────────┐   │
│  │ • Video file access                     │   │
│  │ • Range request handling                │   │
│  │ • User-specific quality settings        │   │
│  │ • Bandwidth adaptation                  │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Session-Based User Management

#### Session State Management

```typescript
class UserSession {
  constructor(
    public readonly userId: string,
    public readonly sessionId: string,
    public preferences: StreamingPreferences,
    public startTime: Date,
    public lastActivity: Date,
  ) {}

  updateActivity(action: string, metadata?: any): void {
    this.lastActivity = new Date();
    // Log activity for analytics
    this.logActivity(action, metadata);
  }

  getStreamingContext(): StreamingContext {
    return {
      userId: this.userId,
      quality: this.preferences.preferredQuality,
      bandwidth: this.preferences.maxBandwidth,
      device: this.preferences.deviceType,
    };
  }
}
```

#### Concurrent Stream Management

```typescript
class StreamManager {
  private activeStreams = new Map<string, ActiveStream>();

  async startStream(session: UserSession, videoId: string): Promise<void> {
    // Check concurrent stream limits
    const userStreams = Array.from(this.activeStreams.values()).filter(
      (stream) => stream.userId === session.userId,
    );

    if (userStreams.length >= this.maxStreamsPerUser) {
      throw new Error('Maximum concurrent streams reached');
    }

    // Create stream tracking
    const streamId = `${session.userId}_${Date.now()}`;
    this.activeStreams.set(streamId, {
      streamId,
      userId: session.userId,
      videoId,
      startTime: new Date(),
      bytesStreamed: 0,
    });
  }
}
```

### Complete Example: User "John" Streaming "movie.mp4"

```
1. Browser Request:
   GET http://192.168.1.100:3000/api/stream/video/movie.mp4
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

2. Application Processing (Port 3000):
   ├── Validates JWT → User ID: john_123
   ├── Session lookup → Existing session found
   ├── Session update → Updates last activity timestamp
   ├── Stream tracking → Creates stream tracking entry
   ├── File access → Direct access to /videos/movie.mp4
   └── Stream response → Direct streaming to browser

3. Session Management:
   ├── User preferences → Applied quality settings
   ├── Activity logging → Stream start logged
   ├── Bandwidth tracking → Monitor for adaptive streaming
   ├── Watch progress → Update user's watch history
   └── Resource monitoring → Track memory/CPU usage

4. Direct Response Flow:
   SSD → NestJS Streaming Service → Browser
   (Video chunks stream directly with session context)
```

### Benefits of Session-Based Architecture

**Resource Efficiency:**

- Shared application resources across all users
- Dynamic memory allocation based on actual usage
- Single process eliminates container overhead

**Performance Advantages:**

- Instant response times (no container startup)
- Direct file system access for optimal I/O
- Efficient session management in memory

**Operational Simplicity:**

- Single application deployment and monitoring
- Centralized logging and error handling
- Simplified debugging and troubleshooting

**Security Benefits:**

- Session-based user isolation
- JWT token validation for all requests
- Application-level access control and auditing

---

## �🔧 Component Architecture

### 1. API Gateway Service (Main Application)

**Responsibilities:**

- User authentication and authorization
- Container lifecycle management
- Request routing to user containers
- Global monitoring and health checks
- Rate limiting and security

**Technology Stack:**

- **Framework**: NestJS with TypeScript
- **Authentication**: JWT with Passport.js
- **Container Management**: Docker API
- **Database**: PostgreSQL with TypeORM
- **Caching**: Redis
- **Monitoring**: Prometheus metrics

**Key Modules:**

```
src/
├── auth/                   # Authentication & Authorization
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── jwt.strategy.ts
│   └── guards/
├── containers/             # Container Lifecycle Management
│   ├── container.controller.ts
│   ├── container.service.ts
│   ├── container-orchestrator.ts
│   └── health-checker.ts
├── users/                  # User Management
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.entity.ts
│   └── dto/
├── videos/                 # Video Metadata Management
│   ├── video.controller.ts
│   ├── video.service.ts
│   ├── video.entity.ts
│   └── video-scanner.ts
├── monitoring/             # System Monitoring
│   ├── health.controller.ts
│   ├── metrics.service.ts
│   └── performance.service.ts
└── common/                 # Shared Components
    ├── decorators/
    ├── filters/
    ├── interceptors/
    └── pipes/
```

### 2. Session Management System

**Responsibilities:**

- Individual user session tracking
- User-specific streaming preferences
- Activity monitoring and analytics
- Watch history and progress tracking

**Technology Stack:**

- **In-Memory Storage**: Map-based session store
- **Persistence**: Redis for session backup
- **Activity Tracking**: Event-driven logging
- **Memory Management**: Automatic cleanup of inactive sessions

**Session Structure:**

```typescript
interface UserSession {
  userId: string;
  sessionId: string;
  preferences: {
    quality: 'auto' | '480p' | '720p' | '1080p';
    maxBandwidth: number;
    deviceType: 'desktop' | 'mobile' | 'tv';
  };
  activity: {
    startTime: Date;
    lastActivity: Date;
    streamsCount: number;
    bytesStreamed: number;
  };
  watchHistory: Array<{
    videoId: string;
    watchTime: number;
    progress: number;
    lastWatched: Date;
  }>;
}
```

### 3. Database Layer

**Primary Database (PostgreSQL):**

- **Users Table**: User accounts and authentication
- **Videos Table**: Video metadata and file information
- **User_Sessions Table**: Active user sessions and activity tracking
- **User_Videos Table**: User-specific video data (watch history, ratings)
- **Playlists Table**: User-created playlists

**Schema Design:**

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    streaming_preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Videos table
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    duration INTEGER, -- in seconds
    resolution VARCHAR(20),
    format VARCHAR(10),
    thumbnail_path VARCHAR(500),
    metadata JSONB, -- Additional video metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255) UNIQUE NOT NULL,
    session_data JSONB,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User video interactions
CREATE TABLE user_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    video_id UUID REFERENCES videos(id),
    watch_time INTEGER DEFAULT 0, -- seconds watched
    watch_progress FLOAT DEFAULT 0, -- percentage completed
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    last_watched TIMESTAMP,
    watch_metadata JSONB, -- Quality watched, device used, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id)
);

-- Playlists
CREATE TABLE playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE playlist_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playlist_id UUID REFERENCES playlists(id),
    video_id UUID REFERENCES videos(id),
    position INTEGER,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(playlist_id, video_id)
);
```

### 4. Caching Layer (Redis)

**Cache Structure:**

```
video:metadata:{video_id}     # Video metadata cache
user:session:{user_id}        # User session cache
user:preferences:{user_id}    # User streaming preferences
video:popular                 # Popular videos list
user:recently_watched:{user_id} # Recently watched videos
video:thumbnails:{video_id}   # Thumbnail cache
streaming:active             # Active streaming sessions
analytics:hourly             # Hourly usage analytics
```

**Cache Patterns:**

- **Write-Through**: Video metadata
- **Cache-Aside**: User sessions
- **TTL-based**: Temporary data (health checks, popular lists)

---

## � Simplified Deployment Architecture

### Single Application Deployment

**Container Strategy:**

1. **Main Application Container**: NestJS streaming application
2. **Database Container**: PostgreSQL
3. **Cache Container**: Redis
4. **Reverse Proxy Container**: Nginx

**Docker Compose Structure:**

```yaml
version: '3.8'
services:
  # Main Streaming Application
  streaming-app:
    build: ./streaming-app
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://streaming_user:${DB_PASSWORD}@database:5432/streaming_platform
      - REDIS_URL=redis://cache:6379
      - VIDEOS_PATH=/app/videos
      - MAX_CONCURRENT_STREAMS=8
    volumes:
      - videos_storage:/app/videos:ro
    depends_on:
      - database
      - cache
    networks:
      - streaming-network

  # Database
  database:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=streaming_platform
      - POSTGRES_USER=streaming_user
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    networks:
      - streaming-network

  # Cache
  cache:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - streaming-network

  # Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - streaming-app
    networks:
      - streaming-network

volumes:
  postgres_data:
  redis_data:
  videos_storage:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /home/swap/Downloads

networks:
  streaming-network:
    driver: bridge
```

### Application Resource Management

**Resource Allocation Strategy:**

```yaml
streaming-app:
  deploy:
    resources:
      limits:
        memory: 2G # Total application limit
        cpus: '2.0' # Use both cores of i5
      reservations:
        memory: 1G # Minimum guaranteed
        cpus: '1.0' # Minimum CPU allocation
  environment:
    - MAX_CONCURRENT_STREAMS=8
    - SESSION_TIMEOUT=1800000 # 30 minutes
    - CHUNK_SIZE=2097152 # 2MB chunks for SSD
  healthcheck:
    test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
    interval: 30s
    timeout: 10s
    retries: 3
```

**Session-Based Resource Monitoring:**

- Memory usage per active session: ~50MB
- CPU usage per stream: ~10-15%
- I/O optimization for SSD storage
- Automatic session cleanup for inactive users

---

## 🌐 Simplified Network Architecture

### Network Topology

**Simplified Network Structure:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Public Network                          │
│                  (Internet Access)                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                 Reverse Proxy                              │
│                (Nginx - Port 80/443)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│              Application Network                            │
│    (NestJS App, Database, Cache - Internal)                │
└─────────────────────────────────────────────────────────────┘
```

**Port Allocation:**

- **80/443**: Nginx (Public access)
- **3000**: NestJS Application (Internal only)
- **5432**: PostgreSQL (Internal only)
- **6379**: Redis (Internal only)

### Load Balancing Strategy

**Nginx Configuration:**

```nginx
upstream streaming_app {
    server streaming-app:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name streaming.local;

    # Main application routes
    location /api/ {
        proxy_pass http://streaming_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Video streaming routes
    location /stream/ {
        proxy_pass http://streaming_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;  # Important for video streaming
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # Static assets (optional)
    location /static/ {
        root /var/www;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 📊 Data Flow Architecture

### Request Flow Patterns

**1. User Authentication Flow:**

```
Client → Nginx → NestJS App → Database
                      ↓
               JWT Token Generated
                      ↓
              Session Created/Updated
                      ↓
               Session Stored in Redis
```

**2. Video Streaming Flow:**

```
Client → Nginx → NestJS App → File System (SSD)
   ↑                   ↓
   └─── Direct Stream ←─┘
```

**3. Video Metadata Flow:**

```
Client → Nginx → NestJS App → Redis Cache
                      ↓           ↑
               (Cache Miss)  (Cache Hit)
                      ↓           ↑
                 Database ─────────┘
```

### Data Consistency Patterns

**Eventual Consistency:**

- User session data in memory vs Redis backup
- Video view counts and streaming analytics
- User activity logs and watch history

**Strong Consistency:**

- User authentication and authorization
- Video file metadata
- Critical user data (passwords, permissions)
- Real-time session state

**Cache Invalidation Strategy:**

- Time-based TTL for frequently changing data (30min sessions)
- Event-based invalidation for critical updates (user preferences)
- Write-through caching for video metadata
- Lazy loading for user-specific data

---

## 🔒 Security Architecture

### Authentication & Authorization

**Multi-Layer Security:**

1. **Network Level**: Firewall rules, private networks
2. **Application Level**: JWT tokens, role-based access
3. **Session Level**: Session validation, activity tracking
4. **Data Level**: Encrypted storage, secure connections

**JWT Token Structure:**

```json
{
  "sub": "user_id",
  "username": "john_doe",
  "role": "user",
  "session_id": "session_123456",
  "preferences": {
    "quality": "1080p",
    "device": "desktop"
  },
  "iat": 1634567890,
  "exp": 1634654290
}
```

**Role-Based Access Control (RBAC):**

- **Admin**: Full system access, user management, analytics
- **User**: Personal streaming access, preference management
- **Guest**: Limited access, temporary sessions

### Session Security

**Session Isolation Mechanisms:**

- **Memory Isolation**: Separate session objects per user
- **Data Isolation**: User-specific data access controls
- **Activity Isolation**: Individual user activity tracking
- **Resource Isolation**: Fair resource allocation per session

**Security Policies:**

```typescript
// Session security configuration
const sessionConfig = {
  maxConcurrentSessions: 3,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  maxInactivity: 15 * 60 * 1000, // 15 minutes
  requireReauth: 24 * 60 * 60 * 1000, // 24 hours
  secureHeaders: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
  },
};
```

---

## 📈 Monitoring & Observability

### Metrics Collection

**Application Metrics:**

- Request rate and response times
- Container resource usage
- Database connection pool status
- Cache hit rates
- Video streaming quality metrics

**Infrastructure Metrics:**

- CPU and memory usage per container
- Network bandwidth utilization
- Disk I/O performance
- Container health status

**Business Metrics:**

- Active user count
- Concurrent streams
- Popular video content
- User engagement metrics

### Monitoring Stack

**Prometheus Configuration:**

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:3000']
    metrics_path: '/metrics'

  - job_name: 'user-containers'
    consul_sd_configs:
      - server: 'consul:8500'
        services: ['user-streaming-container']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

**Grafana Dashboards:**

- System Overview Dashboard
- Container Performance Dashboard
- User Activity Dashboard
- Video Streaming Quality Dashboard

### Logging Strategy

**Structured Logging Format:**

```json
{
  "timestamp": "2025-09-17T10:30:00Z",
  "level": "info",
  "service": "api-gateway",
  "user_id": "user_123",
  "container_id": "container_456",
  "request_id": "req_789",
  "message": "Video stream started",
  "metadata": {
    "video_id": "video_abc",
    "quality": "1080p",
    "client_ip": "192.168.1.100"
  }
}
```

**Log Aggregation:**

- **Fluentd/Fluent Bit**: Log collection and forwarding
- **Elasticsearch**: Log storage and indexing
- **Kibana**: Log visualization and analysis

---

## 🚀 Deployment Architecture

### Environment Strategy

**Development Environment:**

- Single machine Docker Compose
- SQLite database for simplicity
- Local volume mounts
- Hot reloading enabled

**Staging Environment:**

- Multi-container setup
- PostgreSQL database
- Redis cache
- SSL certificates
- Performance testing enabled

**Production Environment:**

- Container orchestration (Docker Swarm/Kubernetes)
- High availability database
- Redis cluster
- CDN integration
- Full monitoring stack

### CI/CD Pipeline

**Pipeline Stages:**

1. **Code Commit** → Git repository
2. **Build Stage** → Docker image creation
3. **Test Stage** → Unit/Integration tests
4. **Security Scan** → Container vulnerability scanning
5. **Deploy Stage** → Environment-specific deployment
6. **Health Check** → Post-deployment verification

**Deployment Strategy:**

- **Blue-Green Deployment**: Zero-downtime updates
- **Rolling Updates**: Gradual container replacement
- **Canary Releases**: Feature testing with subset of users

---

## 🔧 Configuration Management

### Environment Configuration

**Configuration Hierarchy:**

1. **Default Values**: Built into application
2. **Environment Files**: `.env` files per environment
3. **Environment Variables**: Docker/Kubernetes overrides
4. **Config Maps**: Kubernetes configuration
5. **Secrets**: Sensitive data (passwords, keys)

**Configuration Structure:**

```yaml
# config/default.yaml
server:
  port: 3000
  host: 'localhost'

database:
  type: 'postgres'
  host: 'localhost'
  port: 5432
  database: 'streaming_platform'

containers:
  maxPerUser: 1
  resourceLimits:
    memory: '512M'
    cpu: '0.5'
  healthCheckInterval: 30000

video:
  supportedFormats: ['mp4', 'mkv', 'avi', 'mov', 'webm']
  chunkSize: 2097152 # 2MB
  maxConcurrentStreams: 6

cache:
  ttl:
    videoMetadata: 3600 # 1 hour
    userSession: 1800 # 30 minutes
    popularVideos: 300 # 5 minutes
```

This architecture provides a comprehensive foundation for building a scalable, secure, and maintainable video streaming platform optimized for your hardware constraints while allowing for future growth and learning opportunities.

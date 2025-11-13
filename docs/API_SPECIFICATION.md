# Train Service Tracking Tool - API Specification

**Document Version:** 1.0  
**Last Updated:** November 11, 2025  
**Author:** Manus AI

---

## Purpose

This document provides a comprehensive REST API specification for the Train Service Tracking Tool. While the current implementation uses client-side mock data, this specification enables development teams to build a backend API that supports the application's data requirements. The API design is technology-agnostic and can be implemented in any framework (Node.js, .NET, Django, Spring Boot, etc.).

---

## API Overview

### Base URL

```
Production: https://api.traintracking.example.com/v1
Development: http://localhost:8080/api/v1
```

### Authentication

**Current:** No authentication required (public access)

**Future Recommendations:**
- **API Key Authentication**: For programmatic access
- **OAuth 2.0**: For user-based access with different permission levels
- **JWT Tokens**: For stateless authentication

**Example Header:**
```
Authorization: Bearer {jwt_token}
```

### Content Type

All requests and responses use JSON format.

**Request Header:**
```
Content-Type: application/json
```

**Response Header:**
```
Content-Type: application/json; charset=utf-8
```

### Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  }
}
```

**HTTP Status Codes:**

| Status Code | Meaning | Usage |
|-------------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH requests |
| 201 | Created | Successful POST request |
| 204 | No Content | Successful DELETE request |
| 400 | Bad Request | Invalid request parameters or body |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but insufficient permissions |
| 404 | Not Found | Resource does not exist |
| 422 | Unprocessable Entity | Validation errors |
| 500 | Internal Server Error | Server-side error |

---

## Endpoints

### 1. Get Train Services

Retrieve train services with optional filtering.

**Endpoint:**
```
GET /services
```

**Query Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `start_date` | String (YYYY-MM-DD) | No | Filter services on or after this date | `2025-06-20` |
| `end_date` | String (YYYY-MM-DD) | No | Filter services on or before this date | `2025-06-30` |
| `train_number` | String | No | Filter by specific train number | `9339` |
| `regime` | String | No | Filter by régime type | `VENDREDI` |
| `has_issues` | Boolean | No | Filter to only services with verification issues | `true` |
| `tam_tam_ok` | Boolean | No | Filter by Tam Tam verification status | `false` |
| `e_roster_ok` | Boolean | No | Filter by eRoster verification status | `false` |
| `include_templates` | Boolean | No | Include régimé templates (date = null) | `false` |
| `page` | Integer | No | Page number for pagination (1-indexed) | `1` |
| `per_page` | Integer | No | Number of results per page (max 100) | `50` |

**Request Example:**
```
GET /services?start_date=2025-06-20&end_date=2025-06-30&has_issues=true&page=1&per_page=20
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "service_id": "srv-20250620-9339",
      "date": "2025-06-20",
      "train_info": {
        "train_number": "9339",
        "description": "Blue train with mixed crew - Full journey",
        "crew": {
          "driver": "Blue",
          "train_manager": "Red"
        }
      },
      "regime": "VENDREDI",
      "systems_data": {
        "totem_plus": {
          "status": "PUBLISHED",
          "visible": true,
          "schedule": {
            "outbound": {
              "pno_dep": { "time": "12:22", "border_crossing": false, "changed": false },
              "wnh_arr": { "time": "13:18", "border_crossing": true, "changed": false },
              "bru_arr": { "time": "13:44", "border_crossing": false, "changed": false },
              "bru_dep": { "time": "13:53", "border_crossing": false, "changed": false },
              "hdk_arr": { "time": "14:45", "border_crossing": true, "changed": false },
              "ams_arr": { "time": "15:50", "border_crossing": false, "changed": false }
            },
            "return": {}
          }
        },
        "tam_tam": {
          "status": "MANUALLY_CREATED",
          "visible": true,
          "schedule": {
            "outbound": {
              "pno_dep": { "time": "12:22" },
              "wnh_arr": { "time": "13:18", "border_crossing": true },
              "bru_arr": { "time": "13:44" },
              "bru_dep": { "time": "13:53" },
              "hdk_arr": { "time": "14:45", "border_crossing": true },
              "ams_arr": { "time": "15:50" }
            },
            "return": {}
          }
        },
        "e_roster": {
          "status": "NOT_VISIBLE",
          "visible": false,
          "schedule": {
            "outbound": {},
            "return": {}
          }
        }
      },
      "verification": {
        "tam_tam_ok": true,
        "e_roster_ok": false,
      }
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total_pages": 3,
    "total_count": 45
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "start_date must be before or equal to end_date",
    "details": {
      "start_date": "2025-06-30",
      "end_date": "2025-06-20"
    }
  }
}
```

---

### 2. Get Single Service

Retrieve details for a specific train service.

**Endpoint:**
```
GET /services/{service_id}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `service_id` | String | Yes | Unique service identifier |

**Request Example:**
```
GET /services/srv-20250620-9339
```

**Response (200 OK):**

```json
{
  "service_id": "srv-20250620-9339",
  "date": "2025-06-20",
  "train_info": {
    "train_number": "9339",
    "description": "Blue train with mixed crew - Full journey",
    "crew": {
      "driver": "Blue",
      "train_manager": "Red"
    }
  },
  "regime": "VENDREDI",
  "systems_data": {
    "totem_plus": { /* ... */ },
    "tam_tam": { /* ... */ },
    "e_roster": { /* ... */ }
  },
  "verification": {
    "tam_tam_ok": true,
    "e_roster_ok": false,
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "error": {
    "code": "SERVICE_NOT_FOUND",
    "message": "Service with ID 'srv-20250620-9999' does not exist"
  }
}
```

---

### 3. Get Services by Train Number

Retrieve all instances of a specific train number across all dates.

**Endpoint:**
```
GET /services/train/{train_number}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `train_number` | String | Yes | Train identification number |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start_date` | String (YYYY-MM-DD) | No | Filter services on or after this date |
| `end_date` | String (YYYY-MM-DD) | No | Filter services on or before this date |

**Request Example:**
```
GET /services/train/9339?start_date=2025-06-01&end_date=2025-06-30
```

**Response (200 OK):**

```json
{
  "train_number": "9339",
  "services": [
    {
      "service_id": "srv-20250620-9339",
      "date": "2025-06-20",
      /* ... full service object ... */
    },
    {
      "service_id": "srv-20250627-9339",
      "date": "2025-06-27",
      /* ... full service object ... */
    }
  ],
  "count": 2
}
```

---

### 4. Get Régimé Templates

Retrieve régimé template services (reference schedules with no specific date).

**Endpoint:**
```
GET /regimes
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `regime` | String | No | Filter by specific régime type |

**Request Example:**
```
GET /regimes?regime=VENDREDI
```

**Response (200 OK):**

```json
{
  "data": [
    {
      "service_id": "regime-9320",
      "date": null,
      "train_info": {
        "train_number": "9320",
        "description": "Blue train with mixed crew - Return journey only",
        "crew": {
          "driver": "Blue",
          "train_manager": "Red"
        }
      },
      "regime": "VENDREDI",
      "systems_data": {
        "totem_plus": {
          "status": "PUBLISHED",
          "visible": true,
          "schedule": {
            "outbound": {},
            "return": {
              "bru_dep": { "time": "09:43" },
              "wnh_arr": { "time": "10:09", "border_crossing": true },
              "pno_arr": { "time": "11:05" }
            }
          }
        },
        /* ... other systems ... */
      },
      "verification": {
        "tam_tam_ok": true,
        "e_roster_ok": true,
      }
    }
  ],
  "count": 1
}
```

---

### 5. Get Statistics

Retrieve aggregate statistics for filtered services.

**Endpoint:**
```
GET /statistics
```

**Query Parameters:**

Same as `/services` endpoint (all filters apply).

**Request Example:**
```
GET /statistics?start_date=2025-06-01&end_date=2025-06-30&has_issues=false
```

**Response (200 OK):**

```json
{
  "total_trains": 45,
  "total_discrepancies": 12,
  "system_issues": {
    "tam_tam": 5,
    "e_roster": 8,
  },
  "verification_rate": {
    "tam_tam": 88.9,
    "e_roster": 82.2,
    "overall": 73.3
  },
  "filters_applied": {
    "start_date": "2025-06-01",
    "end_date": "2025-06-30",
    "has_issues": false
  }
}
```

---

### 6. Get Services by Date

Retrieve all services operating on a specific date.

**Endpoint:**
```
GET /services/date/{date}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | String (YYYY-MM-DD) | Yes | Operational date |

**Request Example:**
```
GET /services/date/2025-06-20
```

**Response (200 OK):**

```json
{
  "date": "2025-06-20",
  "services": [
    {
      "service_id": "srv-20250620-9320",
      /* ... full service object ... */
    },
    {
      "service_id": "srv-20250620-9339",
      /* ... full service object ... */
    },
    {
      "service_id": "srv-20250620-9376",
      /* ... full service object ... */
    },
    {
      "service_id": "srv-20250620-9395",
      /* ... full service object ... */
    }
  ],
  "count": 4,
  "status_summary": {
    "all_ok": true,
    "has_tam_tam_issues": false,
    "has_e_roster_issues": false,
    "has_vente_issues": false
  }
}
```

---

### 7. Get Calendar Data

Retrieve calendar view data for a specific month.

**Endpoint:**
```
GET /calendar/{year}/{month}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `year` | Integer | Yes | Year (e.g., 2025) |
| `month` | Integer | Yes | Month (1-12) |

**Request Example:**
```
GET /calendar/2025/6
```

**Response (200 OK):**

```json
{
  "year": 2025,
  "month": 6,
  "days": [
    {
      "date": "2025-06-01",
      "day_of_week": "Sunday",
      "service_count": 0,
      "status": {
        "has_services": false
      }
    },
    {
      "date": "2025-06-20",
      "day_of_week": "Friday",
      "service_count": 4,
      "status": {
        "has_services": true,
        "all_ok": true,
        "has_tam_tam_issues": false,
        "has_e_roster_issues": false,
        "has_vente_issues": false
      }
    },
    {
      "date": "2025-06-27",
      "day_of_week": "Friday",
      "service_count": 4,
      "status": {
        "has_services": true,
        "all_ok": false,
        "has_tam_tam_issues": true,
        "has_e_roster_issues": false,
        "has_vente_issues": false
      }
    }
  ]
}
```

---

### 8. Create Service (Future)

Create a new train service.

**Endpoint:**
```
POST /services
```

**Request Body:**

```json
{
  "date": "2025-07-15",
  "train_info": {
    "train_number": "9400",
    "description": "New service",
    "crew": {
      "driver": "Blue",
      "train_manager": "Blue"
    }
  },
  "regime": "VENDREDI",
  "systems_data": {
    "totem_plus": {
      "status": "PUBLISHED",
      "visible": true,
      "schedule": {
        "outbound": {
          "pno_dep": { "time": "14:00" },
          "wnh_arr": { "time": "14:56", "border_crossing": true },
          "bru_arr": { "time": "15:22" }
        },
        "return": {}
      }
    },
    "tam_tam": {
      "status": "MANUALLY_CREATED",
      "visible": true,
      "schedule": {
        "outbound": {
          "pno_dep": { "time": "14:00" },
          "wnh_arr": { "time": "14:56", "border_crossing": true },
          "bru_arr": { "time": "15:22" }
        },
        "return": {}
      }
    },
    "e_roster": {
      "status": "NOT_VISIBLE",
      "visible": false,
      "schedule": {
        "outbound": {},
        "return": {}
      }
    }
  }
}
```

**Response (201 Created):**

```json
{
  "service_id": "srv-20250715-9400",
  "date": "2025-07-15",
  /* ... full service object with computed verification ... */
}
```

**Error Response (422 Unprocessable Entity):**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid service data",
    "details": {
      "train_number": "Train number is required",
      "date": "Date must be in YYYY-MM-DD format"
    }
  }
}
```

---

### 9. Update Service (Future)

Update an existing train service.

**Endpoint:**
```
PUT /services/{service_id}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `service_id` | String | Yes | Unique service identifier |

**Request Body:**

Same structure as Create Service endpoint.

**Response (200 OK):**

```json
{
  "service_id": "srv-20250715-9400",
  /* ... updated service object ... */
}
```

---

### 10. Delete Service (Future)

Delete a train service.

**Endpoint:**
```
DELETE /services/{service_id}
```

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `service_id` | String | Yes | Unique service identifier |

**Response (204 No Content):**

No response body.

**Error Response (404 Not Found):**

```json
{
  "error": {
    "code": "SERVICE_NOT_FOUND",
    "message": "Service with ID 'srv-20250715-9999' does not exist"
  }
}
```

---

## Data Synchronization Endpoints (Future)

### 11. Trigger Data Sync

Manually trigger synchronization with external systems.

**Endpoint:**
```
POST /sync/trigger
```

**Request Body:**

```json
{
  "systems": ["totem_plus", "tam_tam", "e_roster"],
  "start_date": "2025-06-01",
  "end_date": "2025-06-30"
}
```

**Response (202 Accepted):**

```json
{
  "sync_job_id": "sync-20250611-001",
  "status": "queued",
  "systems": ["totem_plus", "tam_tam", "e_roster"],
  "date_range": {
    "start": "2025-06-01",
    "end": "2025-06-30"
  }
}
```

---

### 12. Get Sync Status

Check the status of a synchronization job.

**Endpoint:**
```
GET /sync/{sync_job_id}
```

**Response (200 OK):**

```json
{
  "sync_job_id": "sync-20250611-001",
  "status": "completed",
  "started_at": "2025-06-11T10:30:00Z",
  "completed_at": "2025-06-11T10:35:23Z",
  "systems": {
    "totem_plus": {
      "status": "success",
      "services_synced": 45
    },
    "tam_tam": {
      "status": "success",
      "services_synced": 45
    },
    "e_roster": {
      "status": "partial",
      "services_synced": 38,
      "errors": 7
    }
  }
}
```

---

## Webhooks (Future)

### Service Update Webhook

Notify external systems when service data changes.

**Webhook Payload:**

```json
{
  "event": "service.updated",
  "timestamp": "2025-06-11T10:35:23Z",
  "data": {
    "service_id": "srv-20250620-9339",
    "changes": {
      "verification": {
        "old": {
          "e_roster_ok": false
        },
        "new": {
          "e_roster_ok": true
        }
      }
    }
  }
}
```

---

## Rate Limiting

**Recommended Limits:**
- **Authenticated Users**: 1000 requests per hour
- **Anonymous Users**: 100 requests per hour

**Rate Limit Headers:**

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1623412800
```

**Rate Limit Exceeded Response (429 Too Many Requests):**

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded. Try again in 3600 seconds.",
    "details": {
      "limit": 1000,
      "reset_at": "2025-06-11T11:00:00Z"
    }
  }
}
```

---

## Caching

**Recommended Caching Strategy:**

| Endpoint | Cache Duration | Cache Key |
|----------|---------------|-----------|
| `GET /services` | 5 minutes | Query parameters hash |
| `GET /services/{id}` | 10 minutes | Service ID |
| `GET /regimes` | 1 hour | Régime filter |
| `GET /statistics` | 5 minutes | Query parameters hash |
| `GET /calendar/{year}/{month}` | 15 minutes | Year + Month |

**Cache Headers:**

```
Cache-Control: public, max-age=300
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

---

## Implementation Recommendations

### Technology Stack Options

**Option 1: Node.js + Express**
```javascript
// Example endpoint implementation
app.get('/api/v1/services', async (req, res) => {
  const { start_date, end_date, has_issues } = req.query;
  
  const services = await db.services.find({
    date: { $gte: start_date, $lte: end_date },
    ...(has_issues && { 
      $or: [
        { 'verification.tam_tam_ok': false },
        { 'verification.e_roster_ok': false },
      ]
    })
  });
  
  res.json({ data: services });
});
```

**Option 2: Python + Django REST Framework**
```python
# Example endpoint implementation
class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])
        
        return queryset
```

**Option 3: .NET + ASP.NET Core**
```csharp
// Example endpoint implementation
[HttpGet("services")]
public async Task<ActionResult<ServiceListResponse>> GetServices(
    [FromQuery] string start_date,
    [FromQuery] string end_date,
    [FromQuery] bool? has_issues)
{
    var query = _context.Services.AsQueryable();
    
    if (!string.IsNullOrEmpty(start_date) && !string.IsNullOrEmpty(end_date))
    {
        query = query.Where(s => s.Date >= DateTime.Parse(start_date) 
                              && s.Date <= DateTime.Parse(end_date));
    }
    
    if (has_issues == true)
    {
        query = query.Where(s => !s.Verification.TamTamOk 
                              || !s.Verification.ERosterOk 
                              || !s.Verification.MiseEnVenteOk);
    }
    
    var services = await query.ToListAsync();
    return Ok(new { data = services });
}
```

---

## Summary

This API specification provides a complete, RESTful interface for the Train Service Tracking Tool that supports:

- **Comprehensive Querying**: Flexible filtering by date, train number, régime, and verification status
- **Statistics Aggregation**: Real-time computation of metrics across filtered datasets
- **Calendar Integration**: Optimized endpoints for calendar view data
- **Future Extensibility**: CRUD operations, data synchronization, and webhook support
- **Technology Agnostic**: Can be implemented in any backend framework

Development teams can use this specification to build a production-ready API that seamlessly integrates with the existing frontend application or serves as a standalone data service for multiple client applications.

---

**End of Document**

# Landmark-Based Filtering Feature

## Overview
The admin dashboard now includes a powerful landmark-based filtering system that allows you to:
- Create custom landmarks with GPS coordinates
- Assign names to locations (e.g., "Marina Beach", "Chennai Port")
- Filter hazard reports within a specific radius of any landmark

## How to Use

### 1. **Manage Landmarks**
Click the **"Manage Landmarks"** button at the top of the Reports page.

### 2. **Add a New Landmark**
In the Landmark Manager dialog:
- **Landmark Name**: Give it a meaningful name (e.g., "Marina Beach")
- **Latitude**: Enter the latitude coordinate (e.g., 13.0478)
- **Longitude**: Enter the longitude coordinate (e.g., 80.2824)
- **Search Radius**: Set the default search radius in meters (default: 5000m = 5km)
- Click **"Add Landmark"**

### 3. **Filter by Landmark**
1. Click the **"Filters"** button
2. In the filter panel, find **"Filter by Landmark"**
3. Select a landmark from the dropdown
4. Adjust the **"Search Radius"** if needed (shows only when landmark is selected)
5. Click **"Apply Filters"**

### 4. **Active Landmark Filter**
When a landmark filter is active:
- A blue badge appears above the search bar showing the landmark name and radius
- Click the ❌ on the badge to quickly remove the landmark filter
- Only reports within the specified radius of the landmark will be displayed

### 5. **Delete Landmarks**
In the Landmark Manager:
- Find the landmark you want to remove
- Click the trash icon (🗑️) on the right side
- The landmark will be deleted immediately

## Features

### Distance Calculation
- Uses the **Haversine formula** for accurate distance calculation
- Accounts for Earth's curvature
- Distance measured in meters

### Storage
- Landmarks are stored in **browser localStorage**
- Persists across sessions
- Easy to export/import (future feature)

### Filtering Logic
Reports are shown if:
```
Distance from report location to landmark center ≤ Search Radius
```

## Example Use Cases

### 1. **Coastal Hotspot Monitoring**
Create landmarks for:
- Popular beaches
- Fishing harbors
- Tourist areas

### 2. **Port Authority Monitoring**
Create landmarks for:
- Major ports
- Shipping lanes
- Lighthouse locations

### 3. **Regional Analysis**
Create landmarks for:
- City centers
- District headquarters
- Emergency response centers

## Tips

- Use **smaller radius** (500-1000m) for specific locations like harbors
- Use **larger radius** (5000-10000m) for general coastal areas
- Combine with other filters (hazard type, date range) for precise analysis
- Create multiple landmarks to compare different regions

## Technical Details

### Coordinate Format
- **Latitude**: -90 to 90 (positive = North, negative = South)
- **Longitude**: -180 to 180 (positive = East, negative = West)

### Example Coordinates (India Coastline)
- **Chennai Marina Beach**: 13.0478°N, 80.2824°E
- **Mumbai Gateway of India**: 18.9220°N, 72.8347°E
- **Kochi Port**: 9.9674°N, 76.2719°E
- **Visakhapatnam Beach**: 17.7042°N, 83.3264°E

### Distance Calculation
Earth radius: 6,371,000 meters
Formula: Haversine
Accuracy: ±0.5% for distances < 1000km

## Future Enhancements
- Import/Export landmarks as CSV
- Landmark categories (Beach, Port, City, etc.)
- Heat map visualization
- Multiple landmark filtering (OR/AND logic)
- Automatic landmark suggestions based on report clustering

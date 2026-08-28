# InsightOS

### Intelligent Data Cleaning & Analysis Platform

InsightOS is a web-based data cleaning platform designed to help users upload CSV datasets, identify common data quality problems, apply cleaning operations, and download a cleaned dataset.

The platform provides an easy-to-use interface for performing essential data preprocessing tasks without requiring users to manually edit their datasets.

## Features

### 📁 CSV Dataset Upload

* Upload CSV files through the interface.
* Drag-and-drop dataset upload.
* Automatically detects rows and columns.
* Displays the uploaded dataset in a table.

### ♻️ Duplicate Detection

* Detects repeated complete rows.
* Displays duplicate row numbers.
* Shows unique and duplicate row counts.
* Allows users to remove duplicate rows.

### ↔️ Space Cleaning

Detects and removes:

* Leading spaces
* Trailing spaces
* Multiple consecutive spaces
* Tab characters

### ◻️ Missing Value Handling

Detects common missing-value indicators such as:

* Blank values
* `N/A`
* `NA`
* `NULL`
* `NaN`
* `None`
* `Missing`
* `Unknown`
* `-`
* `--`

Available treatments include:

* N/A
* Mean
* Median
* Mode
* User-specified value

The system provides different recommendations depending on the column type and meaning.

### 📈 Outlier Detection

Supports multiple statistical methods:

* **IQR (Interquartile Range)** — recommended
* **Z-Score**
* **Modified Z-Score**

Users can:

* Review detected outliers
* Remove outlier rows
* Replace outliers with the median
* Cap values using Winsorization
* Preview changes before applying them

### 🔤 Text Formatting

Standardizes text values using:

* Title Case
* UPPERCASE
* lowercase
* Sentence case

Multi-word values are preserved, for example:

```text
salt lake city
```

becomes:

```text
Salt Lake City
```

### ⬇️ Download Cleaned Dataset

After cleaning, users can download the processed dataset as:

```text
InsightOS_Cleaned_Dataset.csv
```

## Project Structure

```text
InsightOS/
└── frontend/
    └── app/
        ├── about/
        │   └── page.tsx
        ├── dashboard/
        │   └── page.tsx
        ├── login/
        │   └── page.tsx
        ├── signup/
        │   └── page.tsx
        ├── globals.css
        ├── layout.tsx
        └── page.tsx
```

## Technology Stack

* **Next.js**
* **React**
* **TypeScript**
* **Tailwind CSS**
* **HTML5**
* **CSS3**

## Data Cleaning Workflow

```text
Upload CSV
    ↓
Load Dataset
    ↓
Analyze Data Quality
    ↓
┌─────────────────────────┐
│ Duplicate Detection     │
│ Space Cleaning          │
│ Missing Values          │
│ Outlier Detection       │
│ Text Formatting         │
└─────────────────────────┘
    ↓
Preview / Apply Changes
    ↓
Cleaned Dataset
    ↓
Download CSV
```

## Current Scope

InsightOS currently focuses on CSV-based data cleaning and preprocessing.

The frontend performs the cleaning operations directly in the browser, allowing users to inspect and modify their dataset before downloading the cleaned version.

## Future Improvements

Planned improvements may include:

* Excel file support
* Larger dataset processing
* Data visualization
* Automated data quality reports
* Statistical analysis
* AI-powered data insights
* Backend processing
* User authentication and dataset history
* Export to multiple formats

## Author

**InsightOS Project**

Built as a data analysis and preprocessing project.

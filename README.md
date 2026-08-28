# InsightOS

### Intelligent Data Cleaning & Analysis Platform

> 🚧 **Project Status: In Progress**

InsightOS is a web-based data cleaning and analysis platform designed to help users upload datasets, identify common data quality issues, apply cleaning operations, and download cleaned data.

The project is currently under development, with additional features and improvements being added.

## Current Features

### 📁 CSV Dataset Upload

* Upload CSV datasets.
* Drag-and-drop file upload.
* Automatically detects rows and columns.
* Displays the uploaded dataset in a table.

### ♻️ Duplicate Detection

* Detects repeated complete rows.
* Displays duplicate row numbers.
* Shows unique and duplicate row counts.
* Allows duplicate rows to be removed.

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

Available treatment methods include:

* N/A
* Mean
* Median
* Mode
* User-specified value

### 📈 Outlier Detection

Supports:

* IQR
* Z-Score
* Modified Z-Score

Users can review detected outliers and choose different treatment methods, including removal, median replacement, and Winsorization.

### 🔤 Text Formatting

Provides text standardization options:

* Title Case
* UPPERCASE
* lowercase
* Sentence case

### ⬇️ Cleaned Dataset Export

Users can download the cleaned dataset as a CSV file after applying cleaning operations.

## Project Structure

```text
InsightOS/
├── README.md
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

* Next.js
* React
* TypeScript
* Tailwind CSS
* HTML
* CSS

## Development Status

InsightOS is currently **under active development**.

### Completed

* CSV upload
* Dataset preview
* Duplicate detection and removal
* Extra-space detection and cleaning
* Missing-value detection and treatment
* Outlier detection and treatment
* Text formatting
* Cleaned CSV download
* Basic dashboard interface

### In Progress

* Data analysis features
* Data visualization
* Insights generation
* Reporting
* Backend integration
* Additional dataset formats
* UI/UX improvements

## Planned Features

Future development may include:

* Excel file support
* Automated data quality reports
* Data visualizations
* Statistical analysis
* AI-powered insights
* Backend data processing
* Dataset history
* Advanced reporting
* Additional export formats

## Project Goal

The goal of InsightOS is to provide a simple and intelligent platform that makes data cleaning and preprocessing easier for users, especially those who want to prepare datasets for analysis and machine learning without manually performing every cleaning operation.

---

**Status:** 🚧 In Progress
**Project:** InsightOS
**Type:** Data Cleaning & Analysis Platform

#!/bin/bash

# find-docs.sh
# Helper script to find relevant design documents based on keywords
# Usage: ./find-docs.sh <keyword>

set -e

# Determine project root dynamically based on script location
# Script is at: .claude/skills/context-first/scripts/find-docs.sh
# Need to go up 4 levels: scripts -> context-first -> skills -> .claude -> project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
DOCS_DIR="$PROJECT_ROOT/docs"
KEYWORD="$1"

if [ -z "$KEYWORD" ]; then
    echo "Usage: $0 <keyword>"
    echo ""
    echo "Example: $0 oauth"
    echo "Example: $0 'sync|happy server'"
    exit 1
fi

echo "🔍 Searching for: $KEYWORD"
echo "=================================================="
echo ""

# Function to search and display results
search_in_dir() {
    local dir=$1
    local label=$2

    echo "📁 $label ($dir)"
    echo "--------------------------------------------------"

    if [ -d "$DOCS_DIR/$dir" ]; then
        results=$(grep -ril "$KEYWORD" "$DOCS_DIR/$dir" 2>/dev/null || true)

        if [ -n "$results" ]; then
            echo "$results" | while read -r file; do
                # Get relative path
                rel_path=${file#$DOCS_DIR/}

                # Count matches
                match_count=$(grep -ic "$KEYWORD" "$file" 2>/dev/null || echo "0")

                echo "  ✓ $rel_path ($match_count matches)"

                # Show first matching line as preview
                preview=$(grep -in "$KEYWORD" "$file" 2>/dev/null | head -1 || true)
                if [ -n "$preview" ]; then
                    echo "    Preview: $preview"
                fi
            done
        else
            echo "  (no matches)"
        fi
    else
        echo "  (directory not found)"
    fi

    echo ""
}

# Search in priority order
search_in_dir "design" "Design Documents (Priority 1)"
search_in_dir "implementation" "Implementation Plans (Priority 2)"
search_in_dir "research" "Research Documents (Priority 3)"
search_in_dir "verification" "Verification Documents (Priority 4)"

# Summary
echo "=================================================="
echo "💡 Tips:"
echo "  - Start with Design documents first"
echo "  - Use 'grep -rn \"$KEYWORD\" $DOCS_DIR/design/' for line numbers"
echo "  - Check feature-mapping.md for common patterns"

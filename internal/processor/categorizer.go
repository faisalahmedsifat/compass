package processor

import (
	"sort"
	"strings"

	"github.com/faisalahmedsifat/compass/pkg/types"
)

// RuleBasedCategorizer categorizes activities using predefined rules
type RuleBasedCategorizer struct {
	rules []types.Rule
}

// NewRuleBasedCategorizer creates a new rule-based categorizer
func NewRuleBasedCategorizer() *RuleBasedCategorizer {
	return &RuleBasedCategorizer{
		rules: createDefaultRules(),
	}
}

// Categorize categorizes the current workspace based on windows
func (c *RuleBasedCategorizer) Categorize(windows []types.Window) (string, float64) {
	if len(windows) == 0 {
		return "Idle", 1.0
	}

	// Sort rules by priority (highest first)
	sort.Slice(c.rules, func(i, j int) bool {
		return c.rules[i].Priority > c.rules[j].Priority
	})

	// Apply rules in priority order
	for _, rule := range c.rules {
		if rule.Matcher(windows) {
			return rule.Category, 1.0 // High confidence for rule matches
		}
	}

	// Fallback: try to infer from single app
	if len(windows) > 0 {
		activeWindow := findActiveWindow(windows)
		if activeWindow != nil {
			category := categorizeByApp(activeWindow.AppName)
			return category, 0.7 // Lower confidence for fallback
		}
	}

	return "Uncategorized", 0.5
}

// createDefaultRules creates the default categorization rules
func createDefaultRules() []types.Rule {
	return []types.Rule{
		{
			Name:     "Development & Testing",
			Priority: 10,
			Matcher: func(windows []types.Window) bool {
				hasIDE := false
				hasLocalhost := false
				hasTerminal := false

				for _, w := range windows {
					if isIDE(w.AppName) {
						hasIDE = true
					}
					if strings.Contains(strings.ToLower(w.Title), "localhost") ||
					   strings.Contains(strings.ToLower(w.Title), "127.0.0.1") {
						hasLocalhost = true
					}
					if isTerminal(w.AppName) {
						hasTerminal = true
					}
				}
				return hasIDE && (hasLocalhost || hasTerminal)
			},
			Category: "Development",
		},
		{
			Name:     "Debugging Session",
			Priority: 9,
			Matcher: func(windows []types.Window) bool {
				hasErrorTerminal := false
				hasStackOverflow := false
				hasIDE := false

				for _, w := range windows {
					title := strings.ToLower(w.Title)
					if isTerminal(w.AppName) && (strings.Contains(title, "error") || 
					   strings.Contains(title, "exception") || 
					   strings.Contains(title, "failed")) {
						hasErrorTerminal = true
					}
					if strings.Contains(title, "stack overflow") || 
					   strings.Contains(title, "stackoverflow") {
						hasStackOverflow = true
					}
					if isIDE(w.AppName) {
						hasIDE = true
					}
				}
				return hasErrorTerminal && (hasStackOverflow || hasIDE)
			},
			Category: "Debugging",
		},
		{
			Name:     "Code Review",
			Priority: 8,
			Matcher: func(windows []types.Window) bool {
				hasGitHub := false
				hasIDE := false
				hasSlack := false

				for _, w := range windows {
					title := strings.ToLower(w.Title)
					if strings.Contains(title, "github") || 
					   strings.Contains(title, "pull request") ||
					   strings.Contains(title, "merge request") {
						hasGitHub = true
					}
					if isIDE(w.AppName) {
						hasIDE = true
					}
					if isCommunication(w.AppName) {
						hasSlack = true
					}
				}
				return hasGitHub && (hasIDE || hasSlack)
			},
			Category: "Code Review",
		},
		{
			Name:     "Learning & Documentation",
			Priority: 7,
			Matcher: func(windows []types.Window) bool {
				hasDocumentation := false
				hasIDE := false
				hasNotes := false

				for _, w := range windows {
					title := strings.ToLower(w.Title)
					app := strings.ToLower(w.AppName)
					
					if strings.Contains(title, "documentation") ||
					   strings.Contains(title, "docs") ||
					   strings.Contains(title, "tutorial") ||
					   strings.Contains(title, "guide") ||
					   strings.Contains(title, "learn") {
						hasDocumentation = true
					}
					if isIDE(w.AppName) {
						hasIDE = true
					}
					if isNoteTaking(app) {
						hasNotes = true
					}
				}
				return hasDocumentation && (hasIDE || hasNotes)
			},
			Category: "Learning",
		},
		{
			Name:     "Communication & Collaboration", 
			Priority: 6,
			Matcher: func(windows []types.Window) bool {
				communicationCount := 0
				hasWorkContext := false

				for _, w := range windows {
					if isCommunication(w.AppName) {
						communicationCount++
					}
					if isIDE(w.AppName) || isTerminal(w.AppName) {
						hasWorkContext = true
					}
				}
				return communicationCount >= 1 && hasWorkContext
			},
			Category: "Communication",
		},
		{
			Name:     "Deep Focus",
			Priority: 5,
			Matcher: func(windows []types.Window) bool {
				// Single application focus or minimal distractions
				workWindows := 0
				distractionWindows := 0

				for _, w := range windows {
					if w.IsActive || isWorkRelated(w.AppName) {
						workWindows++
					} else if isDistraction(w.AppName) {
						distractionWindows++
					}
				}

				return workWindows >= 1 && distractionWindows == 0 && len(windows) <= 3
			},
			Category: "Deep Work",
		},
		{
			Name:     "Research",
			Priority: 4,
			Matcher: func(windows []types.Window) bool {
				browserCount := 0
				hasResearchKeywords := false

				for _, w := range windows {
					if isBrowser(w.AppName) {
						browserCount++
						title := strings.ToLower(w.Title)
						if strings.Contains(title, "research") ||
						   strings.Contains(title, "wiki") ||
						   strings.Contains(title, "article") ||
						   strings.Contains(title, "blog") {
							hasResearchKeywords = true
						}
					}
				}
				return browserCount >= 1 && (hasResearchKeywords || browserCount >= 3)
			},
			Category: "Research",
		},
		{
			Name:     "Meeting & Calls",
			Priority: 3,
			Matcher: func(windows []types.Window) bool {
				for _, w := range windows {
					app := strings.ToLower(w.AppName)
					title := strings.ToLower(w.Title)
					
					if app == "zoom" || app == "microsoft teams" || 
					   app == "google meet" || app == "skype" ||
					   strings.Contains(title, "meeting") ||
					   strings.Contains(title, "zoom") ||
					   strings.Contains(title, "teams") {
						return true
					}
				}
				return false
			},
			Category: "Meetings",
		},
		{
			Name:     "Email & Administration",
			Priority: 2,
			Matcher: func(windows []types.Window) bool {
				for _, w := range windows {
					app := strings.ToLower(w.AppName)
					title := strings.ToLower(w.Title)
					
					if app == "mail" || app == "outlook" || app == "gmail" ||
					   strings.Contains(title, "email") ||
					   strings.Contains(title, "inbox") ||
					   strings.Contains(title, "gmail") {
						return true
					}
				}
				return false
			},
			Category: "Email",
		},
	}
}

// Helper functions to identify application types

func isIDE(appName string) bool {
	app := strings.ToLower(appName)
	ides := []string{
		"visual studio code", "code", "vscode",
		"xcode", "android studio", "intellij",
		"pycharm", "webstorm", "phpstorm",
		"atom", "sublime text", "vim", "emacs",
		"neovim", "cursor",
	}
	
	for _, ide := range ides {
		if strings.Contains(app, ide) {
			return true
		}
	}
	return false
}

func isTerminal(appName string) bool {
	app := strings.ToLower(appName)
	terminals := []string{
		"terminal", "iterm", "iterm2", "alacritty",
		"kitty", "hyper", "warp", "tabby",
	}
	
	for _, term := range terminals {
		if strings.Contains(app, term) {
			return true
		}
	}
	return false
}

func isBrowser(appName string) bool {
	app := strings.ToLower(appName)
	browsers := []string{
		"chrome", "firefox", "safari", "edge",
		"brave", "opera", "arc",
	}
	
	for _, browser := range browsers {
		if strings.Contains(app, browser) {
			return true
		}
	}
	return false
}

func isCommunication(appName string) bool {
	app := strings.ToLower(appName)
	commApps := []string{
		"slack", "discord", "teams", "zoom",
		"skype", "telegram", "whatsapp", "signal",
		"messages", "facetime",
	}
	
	for _, comm := range commApps {
		if strings.Contains(app, comm) {
			return true
		}
	}
	return false
}

func isNoteTaking(appName string) bool {
	app := strings.ToLower(appName)
	noteApps := []string{
		"notion", "obsidian", "logseq", "roam",
		"evernote", "onenote", "bear", "notes",
		"markdown editor", "typora",
	}
	
	for _, note := range noteApps {
		if strings.Contains(app, note) {
			return true
		}
	}
	return false
}

func isWorkRelated(appName string) bool {
	return isIDE(appName) || isTerminal(appName) || 
		   strings.Contains(strings.ToLower(appName), "postman") ||
		   strings.Contains(strings.ToLower(appName), "docker") ||
		   strings.Contains(strings.ToLower(appName), "kubernetes")
}

func isDistraction(appName string) bool {
	app := strings.ToLower(appName)
	distractions := []string{
		"youtube", "netflix", "tiktok", "instagram",
		"facebook", "twitter", "reddit", "twitch",
		"spotify", "music", "games", "steam",
	}
	
	for _, distraction := range distractions {
		if strings.Contains(app, distraction) {
			return true
		}
	}
	return false
}

// categorizeByApp provides fallback categorization based on single app
func categorizeByApp(appName string) string {
	app := strings.ToLower(appName)
	
	if isIDE(appName) {
		return "Development"
	}
	if isTerminal(appName) {
		return "Development"
	}
	if isBrowser(appName) {
		return "Browsing"
	}
	if isCommunication(appName) {
		return "Communication"
	}
	if isNoteTaking(app) {
		return "Planning"
	}
	if strings.Contains(app, "calendar") {
		return "Planning"
	}
	if strings.Contains(app, "music") || strings.Contains(app, "spotify") {
		return "Entertainment"
	}
	if strings.Contains(app, "mail") || strings.Contains(app, "email") {
		return "Email"
	}
	
	return "General"
}

// findActiveWindow finds the active window in the list
func findActiveWindow(windows []types.Window) *types.Window {
	for _, w := range windows {
		if w.IsActive {
			return &w
		}
	}
	return nil
}

// GetCategoryDescription returns a human-readable description of a category
func GetCategoryDescription(category string) string {
	descriptions := map[string]string{
		"Development":    "Writing, testing, or debugging code",
		"Debugging":      "Investigating and fixing errors",
		"Code Review":    "Reviewing code changes and collaborating",
		"Learning":       "Reading documentation, tutorials, or studying",
		"Communication":  "Team collaboration and messaging",
		"Deep Work":      "Focused work with minimal distractions",
		"Research":       "Information gathering and exploration",
		"Meetings":       "Video calls and meetings",
		"Email":          "Email management and correspondence",
		"Planning":       "Task planning and organization",
		"Browsing":       "General web browsing",
		"Entertainment":  "Non-work activities and entertainment",
		"General":        "General computer usage",
		"Uncategorized": "Activity pattern not recognized",
		"Idle":          "No active windows detected",
	}
	
	if desc, exists := descriptions[category]; exists {
		return desc
	}
	return "Unknown activity type"
}

// GetCategoryColor returns a color associated with a category for UI
func GetCategoryColor(category string) string {
	colors := map[string]string{
		"Development":    "#28a745", // Green
		"Debugging":      "#dc3545", // Red
		"Code Review":    "#17a2b8", // Cyan
		"Learning":       "#6f42c1", // Purple
		"Communication":  "#fd7e14", // Orange
		"Deep Work":      "#20c997", // Teal
		"Research":       "#6c757d", // Gray
		"Meetings":       "#007bff", // Blue
		"Email":          "#ffc107", // Yellow
		"Planning":       "#e83e8c", // Pink
		"Browsing":       "#6c757d", // Gray
		"Entertainment":  "#fd7e14", // Orange
		"General":        "#6c757d", // Gray
		"Uncategorized":  "#dee2e6", // Light gray
		"Idle":           "#f8f9fa", // Very light gray
	}
	
	if color, exists := colors[category]; exists {
		return color
	}
	return "#6c757d" // Default gray
}


/**
 * Mention Autocomplete Component
 * Enables @mentions in textareas with autocomplete dropdown
 */

class MentionAutocomplete {
  constructor(textarea, options = {}) {
    this.textarea = textarea;
    this.options = {
      trigger: "@",
      searchDelay: 300,
      maxResults: 5,
      offsetX: 0,
      offsetY: 5,
      minChars: 1,
      ...options,
    };

    this.dropdown = null;
    this.searchTimeout = null;
    this.currentMention = null;
    this.isActive = false;
    this.selectedIndex = -1;
    this.users = [];

    this.init();
  }

  init() {
    // Create dropdown element
    this.createDropdown();

    // Attach event listeners
    this.textarea.addEventListener("input", this.handleInput.bind(this));
    this.textarea.addEventListener("keydown", this.handleKeydown.bind(this));
    this.textarea.addEventListener("blur", this.handleBlur.bind(this));

    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
      if (!this.dropdown.contains(e.target) && e.target !== this.textarea) {
        this.hideDropdown();
      }
    });
  }

  createDropdown() {
    this.dropdown = document.createElement("div");
    this.dropdown.className = "mention-dropdown";
    this.dropdown.style.cssText = `
      position: absolute;
      display: none;
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-height: 200px;
      overflow-y: auto;
      z-index: 10000;
      min-width: 250px;
    `;
    document.body.appendChild(this.dropdown);
  }

  handleInput(e) {
    clearTimeout(this.searchTimeout);

    const cursorPos = this.textarea.selectionStart;
    const textBeforeCursor = this.textarea.value.substring(0, cursorPos);

    // Find the last @ symbol before cursor
    const lastAtIndex = textBeforeCursor.lastIndexOf(this.options.trigger);

    if (lastAtIndex === -1) {
      this.hideDropdown();
      return;
    }

    // Get text after the @ symbol
    const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

    // Check if there's a space (which would end the mention)
    if (textAfterAt.includes(" ") || textAfterAt.includes("\n")) {
      this.hideDropdown();
      return;
    }

    // Must have minimum characters
    if (textAfterAt.length < this.options.minChars) {
      this.hideDropdown();
      return;
    }

    // Store current mention info
    this.currentMention = {
      start: lastAtIndex,
      end: cursorPos,
      query: textAfterAt,
    };

    // Debounced search
    this.searchTimeout = setTimeout(() => {
      this.searchUsers(textAfterAt);
    }, this.options.searchDelay);
  }

  async searchUsers(query) {
    try {
      const response = await apiRequest(
        `/search?q=${encodeURIComponent(query)}`
      );

      if (response.ok) {
        const results = await response.json();
        this.users = results.slice(0, this.options.maxResults);

        if (this.users.length > 0) {
          this.showDropdown();
          this.renderResults();
        } else {
          this.hideDropdown();
        }
      } else {
        this.hideDropdown();
      }
    } catch (error) {
      console.error("Error searching users:", error);
      this.hideDropdown();
    }
  }

  renderResults() {
    this.dropdown.innerHTML = "";
    this.selectedIndex = -1;

    this.users.forEach((user, index) => {
      const item = document.createElement("div");
      item.className = "mention-item";
      item.dataset.index = index;
      item.style.cssText = `
        padding: 10px 15px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: background 0.2s;
      `;

      item.innerHTML = `
        <div style="width: 32px; height: 32px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: #e0e0e0;">
          ${
            user.avatar_url
              ? `<img src="${user.avatar_url}" alt="${user.display_name}" style="width: 100%; height: 100%; object-fit: cover;">`
              : `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width: 100%; height: 100%; padding: 4px;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>`
          }
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; font-size: 14px; color: #333;">${
            user.display_name
          }</div>
          <div style="font-size: 12px; color: #666;">@${user.username}</div>
        </div>
      `;

      item.addEventListener("mouseenter", () => {
        this.selectItem(index);
      });

      item.addEventListener("click", () => {
        this.insertMention(user);
      });

      this.dropdown.appendChild(item);
    });

    // Auto-select first item
    if (this.users.length > 0) {
      this.selectItem(0);
    }
  }

  selectItem(index) {
    // Remove previous selection
    const items = this.dropdown.querySelectorAll(".mention-item");
    items.forEach((item) => {
      item.style.background = "";
    });

    // Highlight new selection
    if (index >= 0 && index < items.length) {
      this.selectedIndex = index;
      items[index].style.background = "#f0f0f0";

      // Scroll into view
      items[index].scrollIntoView({ block: "nearest" });
    }
  }

  handleKeydown(e) {
    if (!this.isActive) return;

    const items = this.dropdown.querySelectorAll(".mention-item");

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.selectItem((this.selectedIndex + 1) % items.length);
        break;

      case "ArrowUp":
        e.preventDefault();
        this.selectItem((this.selectedIndex - 1 + items.length) % items.length);
        break;

      case "Enter":
      case "Tab":
        if (this.selectedIndex >= 0 && this.selectedIndex < this.users.length) {
          e.preventDefault();
          this.insertMention(this.users[this.selectedIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        this.hideDropdown();
        break;
    }
  }

  insertMention(user) {
    if (!this.currentMention) return;

    const beforeMention = this.textarea.value.substring(
      0,
      this.currentMention.start
    );
    const afterMention = this.textarea.value.substring(this.currentMention.end);

    // Insert mention with username
    const mention = `@${user.username}`;
    const newValue = beforeMention + mention + " " + afterMention;

    this.textarea.value = newValue;

    // Set cursor position after the mention
    const newCursorPos = beforeMention.length + mention.length + 1;
    this.textarea.setSelectionRange(newCursorPos, newCursorPos);

    // Trigger input event for any listeners
    this.textarea.dispatchEvent(new Event("input", { bubbles: true }));

    // Store mention data (for submission)
    if (!this.textarea.dataset.mentions) {
      this.textarea.dataset.mentions = "[]";
    }
    const mentions = JSON.parse(this.textarea.dataset.mentions);
    mentions.push({
      username: user.username,
      user_id: user.id,
      display_name: user.display_name,
    });
    this.textarea.dataset.mentions = JSON.stringify(mentions);

    this.hideDropdown();
    this.textarea.focus();
  }

  showDropdown() {
    this.isActive = true;
    this.dropdown.style.display = "block";
    this.positionDropdown();
  }

  hideDropdown() {
    this.isActive = false;
    this.dropdown.style.display = "none";
    this.currentMention = null;
    this.selectedIndex = -1;
  }

  handleBlur() {
    // Delay to allow click events on dropdown
    setTimeout(() => {
      if (!this.dropdown.matches(":hover")) {
        this.hideDropdown();
      }
    }, 200);
  }

  positionDropdown() {
    const textareaRect = this.textarea.getBoundingClientRect();

    // Get cursor position (approximate)
    const cursorPos = this.textarea.selectionStart;
    const textBeforeCursor = this.textarea.value.substring(0, cursorPos);
    const lines = textBeforeCursor.split("\n");
    const currentLine = lines.length - 1;

    // Calculate position
    const lineHeight =
      parseInt(window.getComputedStyle(this.textarea).lineHeight) || 20;
    const scrollTop = this.textarea.scrollTop;

    let top =
      textareaRect.top +
      window.scrollY +
      currentLine * lineHeight -
      scrollTop +
      lineHeight +
      this.options.offsetY;
    let left = textareaRect.left + window.scrollX + this.options.offsetX;

    // Adjust if dropdown goes off screen
    const dropdownRect = this.dropdown.getBoundingClientRect();
    if (left + dropdownRect.width > window.innerWidth) {
      left = window.innerWidth - dropdownRect.width - 10;
    }

    if (top + dropdownRect.height > window.innerHeight) {
      top =
        textareaRect.top +
        window.scrollY -
        dropdownRect.height -
        this.options.offsetY;
    }

    this.dropdown.style.top = `${top}px`;
    this.dropdown.style.left = `${left}px`;
  }

  destroy() {
    if (this.dropdown) {
      this.dropdown.remove();
    }
    clearTimeout(this.searchTimeout);
  }

  // Get all mentioned users from textarea
  getMentions() {
    return JSON.parse(this.textarea.dataset.mentions || "[]");
  }

  // Clear mentions data
  clearMentions() {
    this.textarea.dataset.mentions = "[]";
  }
}

// Helper function to initialize mentions on a textarea
function initMentions(textarea, options = {}) {
  return new MentionAutocomplete(textarea, options);
}

// Auto-initialize on textareas with data-mentions attribute
document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll('textarea[data-mentions="true"]')
    .forEach((textarea) => {
      new MentionAutocomplete(textarea);
    });
});

// Export for use in other scripts
if (typeof window !== "undefined") {
  window.MentionAutocomplete = MentionAutocomplete;
  window.initMentions = initMentions;
}

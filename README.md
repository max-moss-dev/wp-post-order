# Post Sorter WordPress Plugin

A powerful WordPress plugin that provides an intuitive drag-and-drop interface for sorting posts with advanced insertion capabilities. Perfect for managing post order across different post types with a clean, user-friendly admin interface.

## 🚀 Features

### Core Functionality
- **Drag & Drop Sorting**: Intuitive drag-and-drop interface for reordering posts
- **Multi Post Type Support**: Works with all public post types (posts, pages, custom post types)
- **Live Search & Insert**: Real-time search functionality to find and insert posts at specific positions
- **Visual Feedback**: Smooth animations and visual indicators during sorting operations
- **Persistent Ordering**: Custom sort order is maintained across the frontend

### Advanced Features
- **Position-Specific Insertion**: Insert posts before or after any existing post
- **Global Search**: Quick search bar for adding posts to the end of the list
- **Placeholder System**: Interactive placeholders for precise post insertion
- **Keyboard Navigation**: Full keyboard support for accessibility
- **Auto-Save**: Automatic saving of sort order changes
- **Responsive Design**: Mobile-friendly admin interface

## 📋 Requirements

- WordPress 5.0 or higher
- PHP 7.4 or higher
- MySQL 5.6 or higher

## 🔧 Installation

1. **Upload the Plugin**
   ```
   wp-content/plugins/post-sorter/
   ```

2. **Activate the Plugin**
   - Go to WordPress Admin → Plugins
   - Find "Post Sorter" and click "Activate"

3. **Access the Interface**
   - Navigate to WordPress Admin → Post Sorter
   - The plugin creates its own menu item with a sort icon

## 📖 Usage Guide

### Basic Sorting
1. Navigate to **Post Sorter** in your WordPress admin menu
2. Select the post type you want to sort from the dropdown
3. Drag posts up or down using the handle (≡ icon) on the left
4. Changes are automatically saved

### Adding Posts
- **Add First**: Click "Add First" to insert a post at the beginning
- **Add Last**: Use the global search bar to add posts to the end
- **Insert Between**: Click "Add Before" or "Add After" buttons next to any post

### Search & Insert
1. Click any "Add Before/After" button to create a placeholder
2. Type in the search field to find posts (minimum 2 characters)
3. Use arrow keys to navigate results or click to select
4. Press Enter to insert or Escape to cancel

### Post Type Switching
- Use the dropdown at the top to switch between different post types
- Each post type maintains its own independent sort order

## 🏗️ Technical Architecture

### Database Structure
The plugin creates a custom table `wp_post_sorter` with the following schema:
```sql
CREATE TABLE wp_post_sorter (
    id bigint(20) NOT NULL AUTO_INCREMENT,
    post_id bigint(20) NOT NULL,
    sort_order int(11) NOT NULL DEFAULT 0,
    post_type varchar(20) NOT NULL DEFAULT 'post',
    PRIMARY KEY (id),
    UNIQUE KEY post_id (post_id),
    KEY post_type (post_type),
    KEY sort_order (sort_order)
);
```

### Frontend Integration
The plugin automatically modifies the main query on:
- Post type archives
- Home page (for posts)
- Any main query that isn't a search

Sort order is applied using:
- `orderby`: `meta_value_num`
- `meta_key`: `_post_sorter_order`
- `order`: `ASC`

### File Structure
```
post-sorter/
├── post-sorter.php          # Main plugin file
├── assets/
│   ├── css/
│   │   └── admin.css        # Admin interface styles
│   └── js/
│       └── admin.js         # Admin interface JavaScript
└── README.md               # This file
```

## 🎨 Customization

### CSS Customization
The plugin uses WordPress admin styles and can be customized by targeting these classes:
- `.post-sorter-list` - Main container
- `.post-item` - Individual post items
- `.post-handle` - Drag handle
- `.post-placeholder` - Insertion placeholders

### Hooks & Filters
The plugin provides several WordPress hooks for customization:

#### Actions
- `post_sorter_before_save_order` - Before saving sort order
- `post_sorter_after_save_order` - After saving sort order
- `post_sorter_before_insert_post` - Before inserting a post
- `post_sorter_after_insert_post` - After inserting a post

#### Filters
- `post_sorter_supported_post_types` - Modify supported post types
- `post_sorter_posts_per_page` - Change posts per page in admin
- `post_sorter_search_results_limit` - Modify search results limit

## 🔒 Security Features

- **Nonce Verification**: All AJAX requests are protected with WordPress nonces
- **Capability Checks**: Requires `manage_options` capability
- **Input Sanitization**: All user inputs are properly sanitized
- **SQL Injection Protection**: Uses WordPress database methods
- **XSS Prevention**: All output is properly escaped

## 🌐 Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
- Internet Explorer 11 (limited support)

## ♿ Accessibility

The plugin follows WordPress accessibility guidelines:
- Full keyboard navigation support
- Screen reader compatible
- High contrast mode support
- Reduced motion support for users with vestibular disorders
- Proper ARIA labels and roles

## 🐛 Troubleshooting

### Common Issues

**Posts not showing in correct order on frontend**
- Ensure your theme doesn't override the main query
- Check if other plugins are modifying post order
- Verify the post type is public

**Drag and drop not working**
- Check browser console for JavaScript errors
- Ensure jQuery UI is loaded
- Verify admin scripts are enqueued properly

**Search not returning results**
- Check minimum character requirement (2 characters)
- Verify post type selection
- Ensure posts exist and are published

### Debug Mode
Add this to your `wp-config.php` for debugging:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
```

## 🔄 Planned Features

Based on the memory context, the following hierarchical features are planned:

### Hierarchical Post System
- **Parent-Child Relationships**: Utilize WordPress built-in post hierarchy (`post_parent`)
- **Visual Nesting**: Child posts will be visually indented under their parents
- **Expand/Collapse**: Collapsible parent posts to manage large hierarchies
- **Group Dragging**: Moving a parent will move all its children together
- **Hierarchy Preservation**: Maintain current drag-and-drop while respecting hierarchy

## 📝 Changelog

### Version 1.0.1
- Initial release
- Drag and drop sorting functionality
- Multi post type support
- Search and insert capabilities
- Responsive admin interface
- Accessibility improvements

## 👥 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This plugin is licensed under the GPL2 license. See the WordPress Plugin Directory for full license details.

## 🆘 Support

For support, please:
1. Check the troubleshooting section above
2. Search existing issues in the repository
3. Create a new issue with detailed information
4. Include WordPress version, PHP version, and error messages

## 🙏 Credits

Developed with ❤️ for the WordPress community.

- **Author**: Max Moss
- **Version**: 1.0.0
- **WordPress Compatibility**: 5.0+
- **PHP Compatibility**: 7.4+

---

*This plugin enhances your WordPress content management experience with professional-grade post sorting capabilities.*

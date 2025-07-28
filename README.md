# Post Sorter WordPress Plugin

A powerful WordPress plugin that provides an intuitive drag-and-drop interface for sorting posts with advanced insertion capabilities. Perfect for managing post order across different post types with a clean, user-friendly admin interface.

## 🚀 Features

### Core Functionality
- **Position-Specific Insertion**: Insert posts before or after any existing post
- **Drag & Drop Sorting**: Intuitive drag-and-drop interface for reordering posts
- **Multi Post Type Support**: Works with all public post types (posts, pages, custom post types)
- **Live Search & Insert**: Real-time search functionality to find and insert posts at specific positions
- **Persistent Ordering**: Custom sort order is maintained across the frontend

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

### Search & Insert
1. Click any "Add Before/After" button to create a placeholder
2. Type in the search field to find posts (minimum 2 characters)
3. Use arrow keys to navigate results or click to select
4. Press Enter to insert or Escape to cancel

### Post Type Switching
- Use the dropdown at the top to switch between different post types
- Each post type maintains its own independent sort order

## 🏗️ Technical Architecture

### Frontend Integration
The plugin automatically modifies the main query on:
- Post type archives
- Home page (for posts)
- Any main query that isn't a search

Sort order is applied using:
- `orderby`: `meta_value_num`
- `meta_key`: `_post_sorter_order`
- `order`: `ASC`

## 🔒 Security Features

- **Nonce Verification**: All AJAX requests are protected with WordPress nonces
- **Capability Checks**: Requires `manage_options` capability
- **Input Sanitization**: All user inputs are properly sanitized
- **SQL Injection Protection**: Uses WordPress database methods
- **XSS Prevention**: All output is properly escaped


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

### Version 1.0.0
- Initial release
- Drag and drop sorting functionality
- Multi post type support
- Search and insert capabilities
- Responsive admin interface

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

---

*This plugin enhances your WordPress content management experience with professional-grade post sorting capabilities.*

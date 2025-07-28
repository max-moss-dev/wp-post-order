<?php
/**
 * Plugin Name: Post Sorter
 * Description: A simple plugin to sort posts with drag-and-drop functionality and insert post to any position
 * Version: 1.0.0
 * Author: Max Moss
 * License: GPL2
 * Text Domain: post-sorter
 */

if (!defined('ABSPATH')) {
    exit;
}

class Post_Sorter {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('init', array($this, 'init'));
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
    }
    
    public function init() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('wp_ajax_save_post_order', array($this, 'save_post_order'));
        add_action('wp_ajax_search_posts', array($this, 'search_posts'));
        add_action('wp_ajax_insert_post', array($this, 'insert_post'));
        add_filter('pre_get_posts', array($this, 'modify_post_order'));
    }
    
    public function activate() {
        global $wpdb;
        $table_name = $wpdb->prefix . 'post_sorter';
        $charset_collate = $wpdb->get_charset_collate();
        
        $sql = "CREATE TABLE $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            post_id bigint(20) NOT NULL,
            sort_order int(11) NOT NULL DEFAULT 0,
            post_type varchar(20) NOT NULL DEFAULT 'post',
            PRIMARY KEY (id),
            UNIQUE KEY post_id (post_id),
            KEY post_type (post_type),
            KEY sort_order (sort_order)
        ) $charset_collate;";
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
    
    public function deactivate() {
        // Clean up on deactivation if needed
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'Post Sorter',
            'Post Sorter',
            'manage_options',
            'post-sorter',
            array($this, 'render_admin_page'),
            'dashicons-sort',
            30
        );
    }
    
    public function enqueue_admin_scripts($hook) {
        if ('toplevel_page_post-sorter' !== $hook) {
            return;
        }
        
        wp_enqueue_script('jquery-ui-sortable');
        wp_enqueue_script('jquery-ui-autocomplete');
        wp_enqueue_script(
            'post-sorter-admin',
            plugins_url('assets/js/admin.js', __FILE__),
            array('jquery', 'jquery-ui-sortable', 'jquery-ui-autocomplete'),
            '1.1.0',
            true
        );
        
        wp_localize_script('post-sorter-admin', 'post_sorter_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('post_sorter_nonce')
        ));
        
        wp_enqueue_style(
            'post-sorter-admin',
            plugins_url('assets/css/admin.css', __FILE__),
            array(),
            '1.1.0'
        );
    }
    
    public function render_admin_page() {
        if (!current_user_can('manage_options')) {
            wp_die('You do not have sufficient permissions to access this page.');
        }
        
        $post_types = get_post_types(array('public' => true), 'objects');
        $selected_post_type = isset($_GET['post_type']) ? $_GET['post_type'] : 'post';
        
        if (!isset($post_types[$selected_post_type])) {
            $selected_post_type = 'post';
        }
        
        $posts = $this->get_posts_for_sorting($selected_post_type);
        
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <form method="get" action="">
                <input type="hidden" name="page" value="post-sorter" />
                <label for="post-type-select">Select Post Type:</label>
                <select name="post_type" id="post-type-select" onchange="this.form.submit()">
                    <?php foreach ($post_types as $post_type) : ?>
                        <option value="<?php echo esc_attr($post_type->name); ?>" <?php selected($selected_post_type, $post_type->name); ?>>
                            <?php echo esc_html($post_type->labels->name); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </form>
            
            <div id="post-sorter-container">
                <p>Drag and drop posts to reorder them, or use the buttons below to insert new posts.</p>
                
                <ul id="post-sorter-list" class="post-sorter-list">
                    <?php foreach ($posts as $index => $post) : ?>
                        <li class="post-item" data-post-id="<?php echo esc_attr($post->ID); ?>" data-index="<?php echo esc_attr($index); ?>">
                            <div class="post-handle">
                                <span class="dashicons dashicons-menu"></span>
                            </div>
                            <div class="post-content">
                                <strong><?php echo esc_html($post->post_title); ?></strong>
                            </div>
                            <div class="post-actions">
                                <button type="button" class="button button-small insert-before" data-index="<?php echo esc_attr($index); ?>">Add Before</button>
                                <button type="button" class="button button-small insert-after" data-index="<?php echo esc_attr($index); ?>">Add After</button>
                            </div>
                        </li>
                    <?php endforeach; ?>
                </ul>
                
                <div id="post-sorter-message" style="display: none;"></div>
            </div>
            
            <!-- Placeholder template for inline insertion -->
            <template id="placeholder-template">
                <li class="post-item post-placeholder" data-placeholder-id="">
                    <div class="post-handle">
                        <span class="dashicons dashicons-plus"></span>
                    </div>
                    <div class="post-content">
                        <input type="text" class="placeholder-search" placeholder="Search posts to insert..." />
                        <div class="placeholder-search-results"></div>
                    </div>
                    <div class="post-actions">
                        <button type="button" class="button button-small placeholder-cancel">Cancel</button>
                    </div>
                </li>
            </template>
        </div>
        <?php
    }
    
    private function get_posts_for_sorting($post_type = 'post') {
        $posts = get_posts(array(
            'post_type' => $post_type,
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'orderby' => 'meta_value_num',
            'meta_key' => '_post_sorter_order',
            'order' => 'ASC',
            'meta_query' => array(
                'relation' => 'OR',
                array(
                    'key' => '_post_sorter_order',
                    'compare' => 'EXISTS'
                ),
                array(
                    'key' => '_post_sorter_order',
                    'compare' => 'NOT EXISTS'
                )
            )
        ));
        
        if (empty($posts)) {
            $posts = get_posts(array(
                'post_type' => $post_type,
                'post_status' => 'publish',
                'posts_per_page' => -1,
                'orderby' => 'date',
                'order' => 'DESC'
            ));
        }
        
        return $posts;
    }
    
    private function render_post_item($post, $index) {
        ?>
        <li class="post-item" data-post-id="<?php echo esc_attr($post->ID); ?>" data-index="<?php echo esc_attr($index); ?>">
            <div class="post-handle">
                <span class="dashicons dashicons-menu"></span>
            </div>
            <div class="post-content">
                <strong><?php echo esc_html($post->post_title); ?></strong>
            </div>
            <div class="post-actions">
                <button type="button" class="button button-small insert-before" data-index="<?php echo esc_attr($index); ?>">Add Before</button>
                <button type="button" class="button button-small insert-after" data-index="<?php echo esc_attr($index); ?>">Add After</button>
            </div>
        </li>
        <?php
    }
    
    public function search_posts() {
        check_ajax_referer('post_sorter_nonce', 'nonce');
        
        $search_term = isset($_GET['term']) ? sanitize_text_field($_GET['term']) : '';
        $post_type = isset($_GET['post_type']) ? sanitize_text_field($_GET['post_type']) : 'post';
        
        if (strlen($search_term) < 2) {
            wp_send_json(array());
        }
        
        $posts = get_posts(array(
            'post_type' => $post_type,
            'post_status' => 'publish',
            'posts_per_page' => 10,
            's' => $search_term,
            'orderby' => 'relevance',
            'order' => 'DESC'
        ));
        
        $results = array();
        foreach ($posts as $post) {
            $results[] = array(
                'id' => $post->ID,
                'label' => $post->post_title,
                'value' => $post->post_title,
                'date' => get_the_date('', $post->ID)
            );
        }
        
        wp_send_json($results);
    }
    
    public function insert_post() {
        check_ajax_referer('post_sorter_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
        $position = isset($_POST['position']) ? sanitize_text_field($_POST['position']) : 'after';
        $target_index = isset($_POST['target_index']) ? intval($_POST['target_index']) : 0;
        $post_type = isset($_POST['post_type']) ? sanitize_text_field($_POST['post_type']) : 'post';
        $return_html = isset($_POST['return_html']) ? (bool)$_POST['return_html'] : false;
        
        if (!$post_id) {
            wp_send_json_error('Invalid post ID');
        }
        
        // Get current posts for this post type
        $posts = $this->get_posts_for_sorting($post_type);
        
        // Calculate new sort order
        $new_order = $target_index;
        if ($position === 'after') {
            $new_order = $target_index + 1;
        }
        
        // Get current sort order of the post being moved
        $current_sort = get_post_meta($post_id, '_post_sorter_order', true);
        if ($current_sort === '') {
            $current_sort = -1; // New post
        }
        
        // Shift existing posts
        foreach ($posts as $post) {
            if ($post->ID == $post_id) continue; // Skip the post being moved
            
            $post_sort = get_post_meta($post->ID, '_post_sorter_order', true);
            if ($post_sort === '') continue;
            
            // If moving post from higher to lower position
            if ($current_sort > $new_order && $post_sort >= $new_order && $post_sort < $current_sort) {
                update_post_meta($post->ID, '_post_sorter_order', $post_sort + 1);
            }
            // If moving post from lower to higher position
            elseif ($current_sort < $new_order && $post_sort <= $new_order && $post_sort > $current_sort) {
                update_post_meta($post->ID, '_post_sorter_order', $post_sort - 1);
            }
            // If inserting new post
            elseif ($current_sort == -1 && $post_sort >= $new_order) {
                update_post_meta($post->ID, '_post_sorter_order', $post_sort + 1);
            }
        }
        
        // Set new post's sort order
        update_post_meta($post_id, '_post_sorter_order', $new_order);
        
        if ($return_html) {
            // Get the newly inserted post
            $post = get_post($post_id);
            if ($post) {
                ob_start();
                $this->render_post_item($post, $new_order);
                $html = ob_get_clean();
                wp_send_json_success(array('html' => $html));
            }
        }
        
        wp_send_json_success('Post inserted successfully');
    }
    
    public function save_post_order() {
        check_ajax_referer('post_sorter_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        $order = isset($_POST['order']) ? $_POST['order'] : array();
        $post_type = isset($_POST['post_type']) ? sanitize_text_field($_POST['post_type']) : 'post';
        
        if (!is_array($order)) {
            wp_send_json_error('Invalid order data');
        }
        
        foreach ($order as $index => $post_id) {
            $post_id = intval($post_id);
            update_post_meta($post_id, '_post_sorter_order', $index);
        }
        
        wp_send_json_success('Order saved successfully');
    }
    
    public function modify_post_order($query) {
        if (!is_admin() && $query->is_main_query() && !$query->is_search()) {
            if ($query->is_post_type_archive() || $query->is_home()) {
                $post_type = $query->get('post_type');
                if (empty($post_type)) {
                    $post_type = 'post';
                }
                
                $query->set('orderby', 'meta_value_num');
                $query->set('meta_key', '_post_sorter_order');
                $query->set('order', 'ASC');
            }
        }
    }
}

// Initialize the plugin
Post_Sorter::get_instance();
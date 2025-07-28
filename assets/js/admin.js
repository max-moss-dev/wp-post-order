jQuery(document).ready(function($) {
    'use strict';
    
    var $postList = $('#post-sorter-list');
    var $message = $('#post-sorter-message');
    var $template = $('#placeholder-template');
    var placeholderCounter = 0;
    
    // Initialize sortable
    $postList.sortable({
        handle: '.post-handle',
        placeholder: 'post-item-placeholder',
        cursor: 'move',
        opacity: 0.7,
        animation: 150,
        tolerance: 'pointer',
        update: function(event, ui) {
            // Clear and update indices immediately after move
            updatePostIndices();
            saveOrder();
        },
        start: function(event, ui) {
            // Clear indices when starting to drag
            ui.item.removeAttr('data-index');
        },
        stop: function(event, ui) {
            // Ensure indices are updated when drag stops
            updatePostIndices();
        }
    });
    
    // Initialize autocomplete for global search
    $('#post-search').autocomplete({
        source: function(request, response) {
            var postType = $('#post-type-select').val();
            searchPosts(request.term, postType, function(results) {
                response(results);
            });
        },
        minLength: 2,
        select: function(event, ui) {
            insertPostAtPosition(ui.item.id, 'after', -1);
            $(this).val('');
            return false;
        }
    });
    
    // Add First button
    $('#add-first').on('click', function() {
        createPlaceholder('before', 0);
    });
    
    // Add Last button
    $('#add-last').on('click', function() {
        var lastIndex = $postList.find('.post-item:not(.post-placeholder)').length;
        createPlaceholder('after', lastIndex - 1);
    });
    
    // Insert Before/After buttons
    $(document).on('click', '.insert-before', function() {
        var index = parseInt($(this).attr('data-index'), 10);
        createPlaceholder('before', index);
    });
    
    $(document).on('click', '.insert-after', function() {
        var $button = $(this);
        var index = parseInt($button.attr('data-index'), 10);
        
        createPlaceholder('after', index);
    });
    
    // Cancel placeholder
    $(document).on('click', '.placeholder-cancel', function() {
        var $placeholder = $(this).closest('.post-placeholder');
        removePlaceholder($placeholder);
    });
    
    // Search input handler
    $(document).on('input', '.placeholder-search', function() {
        var $placeholder = $(this).closest('.post-placeholder');
        var $results = $placeholder.find('.placeholder-search-results');
        var searchTerm = $(this).val();
        var postType = $('#post-type-select').val();
        
        if (searchTerm.length < 2) {
            $results.empty();
            return;
        }
        
        // Show loading
        $results.html('<div class="placeholder-loading">Searching...</div>');
        
        // Debounce search
        clearTimeout($placeholder.data('searchTimeout'));
        $placeholder.data('searchTimeout', setTimeout(function() {
            searchPosts(searchTerm, postType, function(results) {
                displaySearchResults($results, results, $placeholder);
            });
        }, 300));
    });
    
    // Handle search result selection
    $(document).on('click', '.placeholder-result', function() {
        var $result = $(this);
        var $placeholder = $result.closest('.post-placeholder');
        var postId = $result.data('post-id');
        var position = $placeholder.data('position');
        var targetIndex = $placeholder.data('target-index');
        
        insertPostAtPosition(postId, position, targetIndex, $placeholder);
    });
    
    // Keyboard navigation for search results
    $(document).on('keydown', '.placeholder-search', function(e) {
        var $placeholder = $(this).closest('.post-placeholder');
        var $results = $placeholder.find('.placeholder-search-results');
        var $selected = $results.find('.placeholder-result.selected');
        
        if (e.which === 40) { // Down arrow
            e.preventDefault();
            if ($selected.length === 0) {
                $results.find('.placeholder-result').first().addClass('selected');
            } else {
                $selected.removeClass('selected').next().addClass('selected');
            }
        } else if (e.which === 38) { // Up arrow
            e.preventDefault();
            if ($selected.length === 0) {
                $results.find('.placeholder-result').last().addClass('selected');
            } else {
                $selected.removeClass('selected').prev().addClass('selected');
            }
        } else if (e.which === 13) { // Enter
            e.preventDefault();
            if ($selected.length > 0) {
                $selected.click();
            }
        } else if (e.which === 27) { // Escape
            e.preventDefault();
            removePlaceholder($placeholder);
        }
    });
    
    function createPlaceholder(position, targetIndex) {
        // Remove any existing placeholders
        $('.post-placeholder').remove();
        
        var placeholderId = 'placeholder-' + (++placeholderCounter);
        var $placeholder = $($template.html());
        $placeholder.attr('data-placeholder-id', placeholderId);
        $placeholder.attr('data-position', position);
        $placeholder.attr('data-target-index', targetIndex);
        
        // Find insertion point
        var $items = $postList.find('.post-item:not(.post-placeholder)');
        var insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
        
        if (insertIndex >= $items.length || $items.length === 0) {
            $postList.append($placeholder);
        } else {
            $items.eq(insertIndex).before($placeholder);
        }
        
        // Focus search input
        setTimeout(function() {
            $placeholder.find('.placeholder-search').focus();
        }, 100);
        
        // Add smooth animation
        $placeholder.hide().fadeIn(120);
    }
    
    function removePlaceholder($placeholder) {
        $placeholder.fadeOut(120, function() {
            $(this).remove();
        });
    }
    
    function searchPosts(term, postType, callback) {
        $.ajax({
            url: post_sorter_ajax.ajax_url,
            dataType: 'json',
            data: {
                action: 'search_posts',
                nonce: post_sorter_ajax.nonce,
                term: term,
                post_type: postType
            },
            success: function(data) {
                callback(data);
            },
            error: function() {
                callback([]);
            }
        });
    }
    
    function displaySearchResults($container, results, $placeholder) {
        $container.empty();
        
        if (results.length === 0) {
            $container.html('<div class="placeholder-error">No posts found</div>');
            return;
        }
        
        results.forEach(function(post) {
            var $result = $('<div class="placeholder-result" data-post-id="' + post.id + '">');
            $result.html('<strong>' + escapeHtml(post.label) + '</strong>');
            $container.append($result);
        });
    }
    
    function insertPostAtPosition(postId, position, targetIndex, $placeholder) {
        var postType = $('#post-type-select').val();
        
        // Check if post already exists and remove it
        var $existingPost = $postList.find('.post-item[data-post-id="' + postId + '"]');
        var wasRemoved = false;
        
        if ($existingPost.length > 0) {
            // Clear index before removal
            $existingPost.removeAttr('data-index');
            $existingPost.fadeOut(120, function() {
                $(this).remove();
                // Update all indices after removal
                updatePostIndices();
                wasRemoved = true;
                proceedWithInsertion();
            });
        } else {
            proceedWithInsertion();
        }
        
        function proceedWithInsertion() {
            $.ajax({
                url: post_sorter_ajax.ajax_url,
                type: 'POST',
                data: {
                    action: 'insert_post',
                    nonce: post_sorter_ajax.nonce,
                    post_id: postId,
                    position: position,
                    target_index: targetIndex,
                    post_type: postType,
                    return_html: true
                },
                beforeSend: function() {
                    if ($placeholder) {
                        $placeholder.find('.placeholder-search-results').html('<div class="placeholder-loading">Inserting...</div>');
                    } else {
                        showMessage('Inserting post...', 'info');
                    }
                },
                success: function(response) {
                    if (response.success) {
                        if ($placeholder) {
                            // Replace placeholder with new post
                            var $newPost = $(response.data.html);
                            $placeholder.replaceWith($newPost);
                            $newPost.hide().fadeIn(120);
                        } else {
                            // Global search insertion
                            if (targetIndex === -1) {
                                $postList.append(response.data.html);
                            } else {
                                var $items = $postList.find('.post-item');
                                if (position === 'before' && $items.length > 0) {
                                    $items.first().before(response.data.html);
                                } else {
                                    $postList.append(response.data.html);
                                }
                            }
                            $postList.find('.post-item').last().hide().fadeIn(120);
                        }
                        
                        showMessage('Post inserted successfully!', 'success');
                        
                        // Clear and update indices immediately
                        updatePostIndices();
                        
                        // Save order after insertion with shorter delay
                        setTimeout(saveOrder, 150);
                    } else {
                        showMessage(response.data || 'Error inserting post', 'error');
                        if ($placeholder) {
                            $placeholder.find('.placeholder-search-results').html('<div class="placeholder-error">Error: ' + (response.data || 'Unknown error') + '</div>');
                        }
                    }
                },
                error: function() {
                    showMessage('Error inserting post. Please try again.', 'error');
                    if ($placeholder) {
                        $placeholder.find('.placeholder-search-results').html('<div class="placeholder-error">Connection error</div>');
                    }
                }
            });
        }
    }
    
    function updatePostIndices() {
        // Clear all existing indices first
        $postList.find('.post-item:not(.post-placeholder)').removeAttr('data-index');
        $postList.find('.insert-before, .insert-after').removeAttr('data-index');
        
        // Set new indices
        $postList.find('.post-item:not(.post-placeholder)').each(function(index) {
            $(this).attr('data-index', index);
            $(this).find('.insert-before, .insert-after').attr('data-index', index);
        });
    }
    
    function saveOrder() {
        var order = [];
        $postList.find('.post-item:not(.post-placeholder)').each(function() {
            order.push($(this).data('post-id'));
        });
        
        var postType = $('#post-type-select').val();
        
        $.ajax({
            url: post_sorter_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'save_post_order',
                nonce: post_sorter_ajax.nonce,
                order: order,
                post_type: postType
            },
            beforeSend: function() {
                showMessage('Saving order...', 'info');
            },
            success: function(response) {
                if (response.success) {
                    showMessage('Order saved successfully!', 'success');
                } else {
                    showMessage('Error saving order. Please try again.', 'error');
                }
            },
            error: function() {
                showMessage('Error saving order. Please try again.', 'error');
            }
        });
    }
    
    function showMessage(text, type) {
        $message
            .removeClass('notice-success notice-error notice-info')
            .addClass('notice-' + type)
            .text(text)
            .fadeIn();
        
        setTimeout(function() {
            $message.fadeOut();
        }, 3000);
    }
    
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Prevent form submission on Enter key
    $(document).on('keypress', 'input', function(e) {
        if (e.which === 13 && !$(this).hasClass('placeholder-search')) {
            e.preventDefault();
        }
    });
});
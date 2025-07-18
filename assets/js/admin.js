jQuery(document).ready(function($) {
    'use strict';
    
    var $postList = $('#post-sorter-list');
    var $message = $('#post-sorter-message');
    var $insertModal = $('#insert-modal');
    var $modalSearch = $('#modal-post-search');
    var $searchResults = $('#search-results');
    var currentInsertPosition = null;
    var currentTargetIndex = null;
    var selectedPost = null;
    
    // Initialize sortable
    $postList.sortable({
        handle: '.post-handle',
        placeholder: 'post-item-placeholder',
        cursor: 'move',
        opacity: 0.7,
        update: function(event, ui) {
            saveOrder();
        }
    });
    
    // Initialize autocomplete for search
    $('#post-search, #modal-post-search').autocomplete({
        source: function(request, response) {
            var postType = $('#post-type-select').val();
            $.ajax({
                url: post_sorter_ajax.ajax_url,
                dataType: 'json',
                data: {
                    action: 'search_posts',
                    nonce: post_sorter_ajax.nonce,
                    term: request.term,
                    post_type: postType
                },
                success: function(data) {
                    response(data);
                }
            });
        },
        minLength: 2,
        select: function(event, ui) {
            selectedPost = ui.item;
            console.log('Selected post:', selectedPost);
        }
    });
    
    // Add First button
    $('#add-first').on('click', function() {
        openInsertModal('first', 0);
    });
    
    // Add Last button
    $('#add-last').on('click', function() {
        var lastIndex = $postList.find('.post-item').length;
        openInsertModal('after', lastIndex - 1);
    });
    
    // Insert Before/After buttons
    $(document).on('click', '.insert-before', function() {
        var index = $(this).data('index');
        openInsertModal('before', index);
    });
    
    $(document).on('click', '.insert-after', function() {
        var index = $(this).data('index');
        openInsertModal('after', index);
    });
    
    function openInsertModal(position, targetIndex) {
        currentInsertPosition = position;
        currentTargetIndex = targetIndex;
        selectedPost = null;
        $modalSearch.val('');
        $insertModal.fadeIn();
    }
    
    // Modal insert button
    $('#modal-insert').on('click', function() {
        if (!selectedPost) {
            showMessage('Please select a post to insert', 'error');
            return;
        }
        
        var postType = $('#post-type-select').val();
        
        console.log('Inserting post:', {
            post_id: selectedPost.id,
            position: currentInsertPosition,
            target_index: currentTargetIndex,
            post_type: postType
        });
        
        $.ajax({
            url: post_sorter_ajax.ajax_url,
            type: 'POST',
            data: {
                action: 'insert_post',
                nonce: post_sorter_ajax.nonce,
                post_id: selectedPost.id,
                position: currentInsertPosition,
                target_index: currentTargetIndex,
                post_type: postType
            },
            beforeSend: function() {
                showMessage('Inserting post...', 'info');
            },
            success: function(response) {
                console.log('Insert response:', response);
                if (response.success) {
                    showMessage('Post inserted successfully!', 'success');
                    $insertModal.fadeOut();
                    setTimeout(function() {
                        location.reload();
                    }, 1000);
                } else {
                    showMessage(response.data || 'Error inserting post', 'error');
                }
            },
            error: function(xhr, status, error) {
                console.error('Insert error:', error);
                showMessage('Error inserting post. Please try again.', 'error');
            }
        });
    });
    
    // Modal cancel button
    $('#modal-cancel').on('click', function() {
        $insertModal.fadeOut();
        selectedPost = null;
    });
    
    // Close modal on outside click
    $(window).on('click', function(e) {
        if ($(e.target).is($insertModal)) {
            $insertModal.fadeOut();
            selectedPost = null;
        }
    });
    
    function saveOrder() {
        var order = [];
        $postList.find('.post-item').each(function() {
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
    
    // Prevent form submission on Enter key
    $(document).on('keypress', 'input', function(e) {
        if (e.which === 13) {
            e.preventDefault();
        }
    });
});
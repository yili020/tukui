document.addEventListener('DOMContentLoaded', function() {
    // 图片加载处理
    const images = document.querySelectorAll('.product-image img');
    
    images.forEach(img => {
        if (img.complete) {
            img.classList.add('loaded');
        } else {
            img.addEventListener('load', function() {
                this.classList.add('loaded');
            });
        }
        
        img.addEventListener('error', function() {
            this.closest('.product-image').classList.add('error');
        });
    });

    // 分类切换处理
    const navLinks = document.querySelectorAll('nav ul li a');
    const products = document.querySelectorAll('.product');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有active类
            navLinks.forEach(l => l.classList.remove('active'));
            // 添加当前active类
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            products.forEach(product => {
                if (category === 'all' || product.getAttribute('data-category') === category) {
                    product.style.display = 'block';
                } else {
                    product.style.display = 'none';
                }
            });
        });
    });
}); 
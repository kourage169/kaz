// FAQ Toggle Function
function toggleFaq(element) {
    const faqItem = element.parentElement;
    const isActive = faqItem.classList.contains('active');
    
    // Close all other FAQ items
    const allFaqItems = document.querySelectorAll('.faq-item');
    allFaqItems.forEach(item => {
        item.classList.remove('active');
    });
    
    // Toggle current FAQ item
    if (!isActive) {
        faqItem.classList.add('active');
    }
}

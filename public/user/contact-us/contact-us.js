// Contact form functionality
document.addEventListener('DOMContentLoaded', function() {
  const contactForm = document.getElementById('contact-form');
  const selectedInquiry = document.getElementById('selected-inquiry');
  const inquiryDropdown = document.getElementById('inquiry-dropdown');
  const inquiryItems = document.querySelectorAll('.inquiry-item');
  const submitBtn = document.getElementById('submit-btn');
  
  let selectedInquiryType = 'Support'; // Default value
  
  // Inquiry dropdown functionality
  selectedInquiry.addEventListener('click', function(e) {
    e.stopPropagation();
    inquiryDropdown.classList.toggle('show');
  });
  
  // Select inquiry option
  inquiryItems.forEach(item => {
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      
      const value = this.getAttribute('data-value');
      selectedInquiryType = value;
      
      // Update display
      const selectedText = selectedInquiry.querySelector('span:not(.arrow)');
      if (selectedText) {
        selectedText.textContent = value;
      }
      
      // Close dropdown
      inquiryDropdown.classList.remove('show');
    });
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!selectedInquiry.contains(e.target) && !inquiryDropdown.contains(e.target)) {
      inquiryDropdown.classList.remove('show');
    }
  });
  
  // Form submission
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      subject: document.getElementById('subject').value.trim(),
      message: document.getElementById('message').value.trim(),
      inquiryType: selectedInquiryType
    };
    
    // Basic validation
    if (!formData.name) {
      showToast('Please enter your name', 'error');
      return;
    }
    
    if (!formData.email) {
      showToast('Please enter your email', 'error');
      return;
    }
    
    if (!formData.message) {
      showToast('Please enter your message', 'error');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    // Send form data to backend
    try {
      const response = await fetch('/api/user/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        showToast('Message sent successfully!', 'success');
        contactForm.reset();
        selectedInquiryType = 'Support';
        selectedInquiry.querySelector('span:not(.arrow)').textContent = 'Support';
      } else {
        showToast(result.error || 'Failed to send message', 'error');
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      showToast('Failed to send message. Please try again.', 'error');
    } finally {
      // Re-enable submit button
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
  
  // Toast notification function
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `contact-toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
});

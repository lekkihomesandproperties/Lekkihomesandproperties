let adminToken = localStorage.getItem('lhp_admin_token') || '';

const $ = selector => document.querySelector(selector);

const msg = text => {
  const element = $('#adminMessage');
  if (element) element.textContent = text;
};

// Store the images already belonging to the property being edited.
let existingPropertyImages = [];

// Create temporary URLs for previews of newly selected files.
let previewObjectUrls = [];

// Make API requests.
async function api(path, opts = {}) {
  opts.headers = {
    ...(opts.headers || {}),
    Authorization: 'Bearer ' + adminToken
  };

  const response = await fetch('/api' + path, opts);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw Error(data.message || 'Request failed');
  }

  return data;
}

// Display the appropriate dashboard panel.
function showDashboard() {
  if (adminToken) {
    $('#loginPanel').classList.add('hidden');
    $('#dashboardPanel').classList.remove('hidden');
    loadAdminListings();
  } else {
    $('#loginPanel').classList.remove('hidden');
    $('#dashboardPanel').classList.add('hidden');
  }
}

// Administrator login.
$('#loginForm')?.addEventListener('submit', async event => {
  event.preventDefault();

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(
        Object.fromEntries(new FormData(event.target).entries())
      )
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.token) {
      throw Error(data.message || 'Login failed');
    }

    adminToken = data.token;

    localStorage.setItem('lhp_admin_token', adminToken);

    showDashboard();
  } catch (error) {
    msg(error.message);
  }
});

// Log out.
function adminLogout() {
  adminToken = '';

  localStorage.removeItem('lhp_admin_token');

  showDashboard();
}

// Release temporary image preview URLs.
function clearPreviewObjectUrls() {
  previewObjectUrls.forEach(url => URL.revokeObjectURL(url));
  previewObjectUrls = [];
}

// Display existing and newly selected images.
function renderImagePreviews(files = []) {
  const preview = $('#imagePreview');
  const existing = $('#existingImages');

  if (!preview || !existing) return;

  clearPreviewObjectUrls();

  // Show pictures already saved for this property.
  existing.innerHTML = existingPropertyImages.length
    ? existingPropertyImages.map((url, index) => `
        <div class="image-preview-item">
          ${index === 0
            ? '<span class="main-image-label">Main image</span>'
            : ''}
          <img
            src="${safe(url)}"
            alt="Existing property image ${index + 1}"
            loading="lazy"
          >
          <span>Saved image ${index + 1}</span>
        </div>
      `).join('')
    : '';

  // Preview the files selected from the computer.
  preview.innerHTML = Array.from(files).map((file, index) => {
    const objectUrl = URL.createObjectURL(file);

    previewObjectUrls.push(objectUrl);

    return `
      <div class="image-preview-item">
        <img
          src="${objectUrl}"
          alt="Selected property image ${index + 1}"
        >
        <span>${safe(file.name)}</span>
      </div>
    `;
  }).join('');
}

// Preview selected images immediately.
$('#imageFiles')?.addEventListener('change', event => {
  const files = Array.from(event.target.files || []);

  const invalidFile = files.find(file => !file.type.startsWith('image/'));

  if (invalidFile) {
    alert('Please select image files only.');
    event.target.value = '';
    renderImagePreviews();
    return;
  }

  renderImagePreviews(files);

  if (files.length > 0 && files.length < 8) {
    msg(
      `You selected ${files.length} image(s). ` +
      'You can select more if available; 8 or more is recommended.'
    );
  } else if (files.length >= 8) {
    msg(`You selected ${files.length} images. Ready to upload.`);
  }
});

// Reset the form and image previews.
function resetPropertyForm() {
  const form = $('#propertyForm');

  form.reset();

  form.elements.id.value = '';

  existingPropertyImages = [];

  clearPreviewObjectUrls();

  $('#imagePreview').innerHTML = '';
  $('#existingImages').innerHTML = '';

  msg('Ready to add a new property.');
}

// Upload one image to your existing upload endpoint.
async function uploadPropertyImage(file) {
  const uploadData = new FormData();

  // Your current backend expects the field name "image".
  uploadData.append('image', file);

  const response = await fetch('/api/uploads/property-image', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + adminToken
    },
    body: uploadData
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw Error(data.message || `Could not upload ${file.name}`);
  }

  const imageUrl = data.url || data.secure_url;

  if (!imageUrl) {
    throw Error(
      `The upload endpoint did not return an image URL for ${file.name}.`
    );
  }

  return imageUrl;
}

// Save a new property or update an existing property.
$('#propertyForm')?.addEventListener('submit', async event => {
  event.preventDefault();

  const form = event.target;
  const saveButton = form.querySelector('button[type="submit"], button:not([type])');

  const formData = new FormData(form);

  const id = String(formData.get('id') || '').trim();

  const selectedFiles = Array.from(
    $('#imageFiles')?.files || []
  );

  const imageUrl = String(formData.get('image') || '').trim();

  if (!imageUrl && existingPropertyImages.length === 0 && selectedFiles.length === 0) {
    alert('Please provide an image URL or select at least one property picture.');
    return;
  }

  if (selectedFiles.some(file => !file.type.startsWith('image/'))) {
    alert('Please select image files only.');
    return;
  }

  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = 'Saving property...';
  }

  try {

//     // Start with the images already saved for this property.
//     // let imageUrls = [...existingPropertyImages];

//     // If the admin supplies a different image URL, make it the main image.
//     if (imageUrl) {
//       imageUrls = [
//         imageUrl,
//         ...imageUrls.filter(url => url !== imageUrl)
//       ];
//     }


   

// const uploadLimit = 3;
// const imageUrls = new Array(selectedFiles.length);
// let nextIndex = 0;
// let completedUploads = 0;

// async function uploadWorker() {
//   while (nextIndex < selectedFiles.length) {
//     const index = nextIndex++;

//     msg(
//       `Uploading and optimizing images: ${completedUploads}/${selectedFiles.length} completed...`
//     );

//     const uploadedUrl = await uploadPropertyImage(selectedFiles[index]);

//     imageUrls[index] = uploadedUrl;
//     completedUploads++;

//     msg(
//       `Uploading and optimizing images: ${completedUploads}/${selectedFiles.length} completed...`
//     );
//   }
// }

// try {
//   await Promise.all(
//     Array.from(
//       { length: Math.min(uploadLimit, selectedFiles.length) },
//       () => uploadWorker()
//     )
//   );



  
// } 


// catch (error) {
//   console.error('Property image upload failed:', error);
//   throw error;
// }
    





//     // Remove duplicate URLs while preserving their order.
//     imageUrls = [...new Set(imageUrls)];

//     if (imageUrls.length === 0) {
//       throw Error('No property images are available to save.');
//     }


// Start with the images already saved for this property.
let imageUrls = [...existingPropertyImages];

// If the admin supplies a different image URL, make it the main image.
if (imageUrl) {
  imageUrls = [
    imageUrl,
    ...imageUrls.filter(url => url !== imageUrl)
  ];
}

// Upload newly selected images to Cloudinary.
// Upload up to three images simultaneously.
const uploadLimit = 3;
const uploadedUrls = new Array(selectedFiles.length);

let nextIndex = 0;
let completedUploads = 0;

async function uploadWorker() {
  while (true) {
    const index = nextIndex++;

    if (index >= selectedFiles.length) {
      return;
    }

    msg(
      `Uploading images: ${completedUploads}/${selectedFiles.length} completed...`
    );

    const uploadedUrl = await uploadPropertyImage(selectedFiles[index]);

    uploadedUrls[index] = uploadedUrl;
    completedUploads++;

    msg(
      `Uploading images: ${completedUploads}/${selectedFiles.length} completed...`
    );
  }
}

await Promise.all(
  Array.from(
    { length: Math.min(uploadLimit, selectedFiles.length) },
    () => uploadWorker()
  )
);

// Append the new image URLs to the existing images.
imageUrls.push(...uploadedUrls);

// Remove duplicate URLs while preserving their order.
imageUrls = [...new Set(imageUrls)];

if (imageUrls.length === 0) {
  throw Error('No property images are available to save.');
}


    // Build the property data.
    const payload = {};

    const allowedFields = [
      'title',
      'location',
      'price',
      'type',
      'category',
      'beds',
      'baths',
      'area',
      'description'
    ];

    for (const key of allowedFields) {
      const value = formData.get(key);

      if (value !== null) {
        payload[key] = value;
      }
    }

    // Send all image URLs to the property route.
    payload.images = imageUrls;

    // Keep the first image in the original field for compatibility.
    payload.image = imageUrls[0];

    payload.price = Number(payload.price);
    payload.beds = Number(payload.beds || 0);
    payload.baths = Number(payload.baths || 0);

    // Payment terms are configured by the administrator per property.
    payload.paymentSettings = {
      enabled: Boolean(form.elements.paymentEnabled?.checked),
      allowFullPayment: Boolean(form.elements.allowFullPayment?.checked),
      allowDeposit: Boolean(form.elements.allowDeposit?.checked),
      depositAmount: Number(form.elements.depositAmount?.value || 0),
      allowMonthlyInstallments: Boolean(form.elements.allowMonthlyInstallments?.checked),
      monthlyAmount: Number(form.elements.monthlyAmount?.value || 0),
      monthlyMonths: Number(form.elements.monthlyMonths?.value || 0),
      allowCustomInstallments: Boolean(form.elements.allowCustomInstallments?.checked)
    };

    msg('Saving property details...');

    await api('/properties' + (id ? '/' + id : ''), {
      method: id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    alert(
      `Property saved successfully with ${imageUrls.length} image(s).`
    );

    resetPropertyForm();

    await loadAdminListings();
  } catch (error) {
    alert(error.message || 'Could not save property.');
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = 'Save property';
    }
  }
});

// Load existing property listings.
async function loadAdminListings() {
  try {
    const data = await api('/properties');

    const properties = data.properties || [];

    $('#adminListings').innerHTML = properties.length
      ? `
        <table class="admin-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Price</th>
              <th>Views</th>
              <th>Images</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${properties.map(property => {
              const imageCount = getPropertyImages(property).length;

              return `
                <tr>
                  <td>
                    ${safe(property.title)}
                    <br>
                    <small>${safe(property.location)}</small>
                  </td>
                  <td>
                    ₦${Number(property.price).toLocaleString('en-NG')}
                  </td>
                  <td>${property.views || 0}</td>
                  <td>${imageCount}</td>
                  <td>
                    <button
                      class="small-btn"
                      onclick="editProperty('${property._id}')"
                    >Edit</button>

                    <button
                      class="small-btn"
                      onclick="deleteProperty('${property._id}')"
                    >Delete</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `
      : 'No properties yet. Add your first listing above.';
  } catch (error) {
    $('#adminListings').textContent = error.message;
  }
}

// Return the available images for a property.
function getPropertyImages(property) {
  const images = Array.isArray(property.images)
    ? property.images.filter(url => typeof url === 'string' && url.trim())
    : [];

  // Support older properties that have only the image field.
  if (property.image && !images.includes(property.image)) {
    images.unshift(property.image);
  }

  return [...new Set(images)];
}

// Load an existing property into the editor.
async function editProperty(id) {
  try {
    const data = await api('/properties/' + id);
    const property = data.property;
    const form = $('#propertyForm');

    if (!property) {
      throw Error('Property could not be found.');
    }

    // IMPORTANT: Store the actual MongoDB ID in the hidden form field.
    const propertyId = String(property._id || property.id || id || '').trim();

    if (!propertyId) {
      throw Error('Could not identify this property. Please try again.');
    }

    form.elements.id.value = propertyId;

    // Populate the other property fields.
    for (const key of [
      'title',
      'location',
      'price',
      'type',
      'category',
      'beds',
      'baths',
      'area',
      'description'
    ]) {
      if (form.elements[key]) {
        form.elements[key].value = property[key] ?? '';
      }
    }

    // Restore existing payment settings.
    const payment = property.paymentSettings || {};

    if (form.elements.paymentEnabled) {
      form.elements.paymentEnabled.checked = Boolean(payment.enabled);
    }

    if (form.elements.allowFullPayment) {
      form.elements.allowFullPayment.checked = payment.allowFullPayment !== false;
    }

    if (form.elements.allowDeposit) {
      form.elements.allowDeposit.checked = payment.allowDeposit !== false;
    }

    if (form.elements.depositAmount) {
      form.elements.depositAmount.value = payment.depositAmount ?? '';
    }

    if (form.elements.allowMonthlyInstallments) {
      form.elements.allowMonthlyInstallments.checked = Boolean(payment.allowMonthlyInstallments);
    }

    if (form.elements.monthlyAmount) {
      form.elements.monthlyAmount.value = payment.monthlyAmount ?? '';
    }

    if (form.elements.monthlyMonths) {
      form.elements.monthlyMonths.value = payment.monthlyMonths ?? '';
    }

    if (form.elements.allowCustomInstallments) {
      form.elements.allowCustomInstallments.checked = payment.allowCustomInstallments !== false;
    }

    // Restore existing property images.
    existingPropertyImages = getPropertyImages(property);

    if (form.elements.image) {
      form.elements.image.value = existingPropertyImages[0] || '';
    }

    if ($('#imageFiles')) {
      $('#imageFiles').value = '';
    }

    renderImagePreviews();

    msg('Editing existing property. Changes will update this listing.');

    form.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

  } catch (error) {
    alert(error.message || 'Could not load property.');
  }
}
// Delete a property.
async function deleteProperty(id) {
  if (!confirm('Delete this property listing? This cannot be undone.')) {
    return;
  }

  try {
    await api('/properties/' + id, {
      method: 'DELETE'
    });

    await loadAdminListings();
  } catch (error) {
    alert(error.message);
  }
}

// Escape text before inserting it into HTML.
function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[character]));
}

// Initialize the dashboard.
showDashboard();

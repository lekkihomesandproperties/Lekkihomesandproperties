const API='https://lekkihomesandproperties.onrender.com/api';
const sampleProperties=[
 { _id:'demo1', title:'Contemporary 4-Bedroom Terrace Duplex', location:'Lekki Phase 1, Lagos', price:185000000, type:'For Sale', category:'House', beds:4, baths:4, area:'280 sqm', views:128, likes:12, image:'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85', description:'A refined contemporary home with generous living spaces, modern finishes and convenient access to key parts of Lekki.' },
 { _id:'demo2', title:'Residential Land in a Serene Estate', location:'Sangotedo, Ajah, Lagos', price:28000000, type:'For Sale', category:'Land', beds:0, baths:0, area:'500 sqm', views:84, likes:9, image:'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85', description:'A well-positioned plot for a future home or a long-term investment. Confirm title documents and boundaries during due diligence.' },
 { _id:'demo3', title:'Bright 3-Bedroom Apartment', location:'Ikate, Lekki, Lagos', price:9500000, type:'For Lease', category:'Apartment', beds:3, baths:3, area:'145 sqm', views:211, likes:21, image:'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85', description:'An inviting apartment with practical room layouts, natural light and easy access to everyday amenities.' },
 { _id:'demo4', title:'Modern 5-Bedroom Detached Home', location:'Chevron Drive, Lekki, Lagos', price:260000000, type:'For Sale', category:'House', beds:5, baths:5, area:'420 sqm', views:176, likes:17, image:'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85', description:'A spacious detached home designed for comfortable family living and entertaining.' },
 { _id:'demo5', title:'Commercial Land Opportunity', location:'Epe, Lagos', price:12000000, type:'For Sale', category:'Land', beds:0, baths:0, area:'600 sqm', views:69, likes:7, image:'https://images.unsplash.com/photo-1464938050520-ef2270bb8ce8?auto=format&fit=crop&w=1200&q=85', description:'Land opportunity for buyers exploring residential or commercial development. Conduct independent checks before purchase.' },
 { _id:'demo6', title:'Fully Serviced 2-Bedroom Apartment', location:'Oniru, Victoria Island axis', price:12500000, type:'For Lease', category:'Apartment', beds:2, baths:2, area:'110 sqm', views:98, likes:11, image:'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85', description:'A well-presented apartment with convenient access to business districts, restaurants and lifestyle amenities.' }
];
const money=n=>'₦'+Number(n||0).toLocaleString('en-NG');
async function getProperties(){try{const r=await fetch(API+'/properties');if(!r.ok)throw 0;const d=await r.json();return d.properties?.length?d.properties:sampleProperties}catch{return sampleProperties}}


function propertyCard(p){return `<article class="property-card"><div class="property-image">
    
    
    


    <img src="${esc(p.images?.[0] || p.image || 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=80')}"



alt="${esc(p.title)}" loading="lazy"><span class="tag">${esc(p.type||'For Sale')}</span></div><div class="property-body"><h3>${esc(p.title)}</h3><div class="location">⌖ ${esc(p.location)}</div><div class="price">${money(p.price)}${p.type==='For Lease'?'<small class="muted"> / year</small>':''}</div><div class="property-meta"><span>▦ ${esc(p.area||'Ask for details')}</span>${p.beds?`<span>🛏 ${p.beds} beds</span>`:''}${p.baths?`<span>♧ ${p.baths} baths</span>`:''}<span>◉ ${p.views||0} views</span></div><div class="card-actions"><button class="btn btn-green" onclick="openProperty('${p._id}')">View details</button><button class="small-btn" onclick="likeProperty('${p._id}')">♡ <span id="likes-${p._id}">${p.likes||0}</span></button><button class="small-btn" onclick="shareProperty('${p._id}')">↗ Share</button></div></div></article>`}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
async function renderProperties(target='propertyGrid',limit=99){const el=document.getElementById(target);if(!el)return;let props=await getProperties();const q=(document.getElementById('propertySearch')?.value||'').toLowerCase();const type=document.getElementById('typeFilter')?.value||'';const category=document.getElementById('categoryFilter')?.value||'';props=props.filter(p=>(!q||`${p.title} ${p.location}`.toLowerCase().includes(q))&&(!type||p.type===type)&&(!category||p.category===category)).slice(0,limit);el.innerHTML=props.length?props.map(propertyCard).join(''):'<div class="empty-state">No matching properties found. Try another search.</div>'}



// async function openProperty(id)

// {let p=(await getProperties()).find(x=>x._id===id)||sampleProperties.find(x=>x._id===id);if(!p)return;try{const r=await fetch(`${API}/properties/${id}/view`,{method:'POST'});if(r.ok)p= (await r.json()).property||p}catch{}const modal=document.getElementById('propertyModal');if(!modal){location.href=`property-listings.html?property=${encodeURIComponent(id)}`;return}document.getElementById('modalContent').innerHTML=`<img class="modal-image" src="${esc(p.image)}" alt="${esc(p.title)}"><div class="modal-content"><span class="eyebrow" style="color:#9c7714">${esc(p.type)}</span><h2 style="color:var(--green);margin:0">${esc(p.title)}</h2><p class="location">⌖ ${esc(p.location)}</p><div class="price">${money(p.price)}${p.type==='For Lease'?'<small class="muted"> / year</small>':''}</div><p>${esc(p.description||'Contact our team for full property details and inspection arrangements.')}</p><div class="property-meta"><span>Views: ${p.views||0}</span><span>Likes: ${p.likes||0}</span><span>${esc(p.area||'Details on request')}</span></div><div class="card-actions"><button class="btn btn-primary" onclick="startPayment('${p._id}')">Pay / Reserve</button><button class="btn btn-green" onclick="contactProperty('${p._id}')">Contact agent</button><button class="small-btn" onclick="shareProperty('${p._id}')">↗ Share</button></div><hr style="border:0;border-top:1px solid var(--line);margin:22px 0"><h3>Comments & questions</h3><div id="commentList" class="comment-list">Loading comments…</div><form onsubmit="submitComment(event,'${p._id}')"><div class="field"><label for="commentName">Your name</label><input id="commentName" required maxlength="80" placeholder="Full name"></div><div class="field"><label for="commentText">Comment</label><textarea id="commentText" required maxlength="1000" placeholder="Ask a question about this property"></textarea></div><button class="btn btn-green">Post comment</button></form></div>`;modal.classList.add('open');document.body.style.overflow='hidden';loadComments(id)}





// Store the images currently displayed in the property modal
let currentGalleryImages = [];
let currentGalleryIndex = 0;

// Get all images for a property, supporting old and new records
function getPropertyImages(property) {
    const images = Array.isArray(property.images)
        ? property.images.filter(
            image => typeof image === 'string' && image.trim()
        )
        : [];

    // Include the existing main image if it isn't already in the array
    if (
        property.image &&
        !images.includes(property.image)
    ) {
        images.unshift(property.image);
    }

    return [...new Set(images)];
}

// Open a property and display its image gallery
async function openProperty(id) {
    let p = (await getProperties()).find(
        x => x._id === id
    ) || sampleProperties.find(
        x => x._id === id
    );

    if (!p) return;

    try {
        const response = await fetch(
            `${API}/properties/${id}/view`,
            { method: 'POST' }
        );

        if (response.ok) {
            const data = await response.json();
            p = data.property || p;
        }
    } catch (error) {
        console.log('Could not update property views.');
    }

    const modal = document.getElementById('propertyModal');

    if (!modal) {
        location.href =
            `property-listings.html?property=${encodeURIComponent(id)}`;
        return;
    }

    // Load this property's pictures
    currentGalleryImages = getPropertyImages(p);
    currentGalleryIndex = 0;

    // Fallback when no image has been uploaded
    if (currentGalleryImages.length === 0) {
        currentGalleryImages = [
            'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85'
        ];
    }

    const images = currentGalleryImages;
    const hasMultipleImages = images.length > 1;

    document.getElementById('modalContent').innerHTML = `
        <div class="property-gallery">

            <div class="gallery-main">

                <img
    id="galleryMainImage"
    class="modal-image clickable-property-image"
    src="${esc(images[0])}"
    alt="${esc(p.title)}"
    onclick="openLightbox(currentGalleryIndex)"
    title="Click to view full-size image"
    role="button"
    tabindex="0"
    onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openLightbox(currentGalleryIndex)}"
>

                <button
                    type="button"
                    class="gallery-arrow gallery-prev"
                    id="galleryPrev"
                    aria-label="Previous property image"
                    onclick="changeGalleryImage(-1)"
                    ${hasMultipleImages ? '' : 'hidden'}
                >
                    &#10094;
                </button>

                <button
                    type="button"
                    class="gallery-arrow gallery-next"
                    id="galleryNext"
                    aria-label="Next property image"
                    onclick="changeGalleryImage(1)"
                    ${hasMultipleImages ? '' : 'hidden'}
                >
                    &#10095;
                </button>

                <div
                    class="gallery-counter"
                    id="galleryCounter"
                    aria-live="polite"
                >
                    1 / ${images.length}
                </div>

            </div>

            <div
                class="gallery-thumbnails"
                id="galleryThumbnails"
                ${hasMultipleImages ? '' : 'hidden'}
            >
                ${images.map((image, index) => `
                    <button
                        type="button"
                        class="gallery-thumb ${index === 0 ? 'active' : ''}"
                        onclick="openLightbox(${index})"
                        aria-label="View image ${index + 1}"
                    >
                        <img
                            src="${esc(image)}"
                            alt="Property image ${index + 1}"
                            loading="lazy"
                        >
                    </button>
                `).join('')}
            </div>

        </div>

        <div class="modal-content">

            <span class="eyebrow" style="color:#9c7714">
                ${esc(p.type)}
            </span>

            <h2 style="color:var(--green);margin:0">
                ${esc(p.title)}
            </h2>

            <p class="location">
                ⌖ ${esc(p.location)}
            </p>

            <div class="price">
                ${money(p.price)}
                ${p.type === 'For Lease'
                    ? '<small class="muted"> / year</small>'
                    : ''}
            </div>

            <p>
                ${esc(
                    p.description ||
                    'Contact our team for full property details and inspection arrangements.'
                )}
            </p>

            <div class="property-meta">
                <span>Views: ${p.views || 0}</span>
                <span>Likes: ${p.likes || 0}</span>
                <span>${esc(p.area || 'Details on request')}</span>
                ${p.beds
                    ? `<span>${p.beds} beds</span>`
                    : ''}
                ${p.baths
                    ? `<span>${p.baths} baths</span>`
                    : ''}
            </div>

            <div class="card-actions">
                <button
                    class="btn btn-primary"
                    onclick="startPayment('${p._id}')"
                >
                    Pay/Now
                </button>

                <button
                    class="btn btn-green"
                    onclick="contactProperty('${p._id}')"
                >
                    WhatsApp-Us
                </button>

                <button
                    class="small-btn"
                    onclick="shareProperty('${p._id}')"
                >
                    ↗ Share
                </button>
            </div>

            <hr style="border:0;border-top:1px solid var(--line);margin:22px 0">

            <h3>Comments & questions</h3>

            <div id="commentList" class="comment-list">
                Loading comments…
            </div>

            <form onsubmit="submitComment(event,'${p._id}')">

                <div class="field">
                    <label for="commentName">Your name</label>
                    <input
                        id="commentName"
                        required
                        maxlength="80"
                        placeholder="Full name"
                    >
                </div>

                <div class="field">
                    <label for="commentText">Comment</label>
                    <textarea
                        id="commentText"
                        required
                        maxlength="1000"
                        placeholder="Ask a question about this property"
                    ></textarea>
                </div>

                <button class="btn btn-green">
                    Post comment
                </button>

            </form>

        </div>
    `;

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';

    loadComments(id);
}

// Display the next or previous image
function changeGalleryImage(direction) {
    if (currentGalleryImages.length <= 1) return;

    const total = currentGalleryImages.length;

    currentGalleryIndex =
        (currentGalleryIndex + direction + total) % total;

    updateGalleryDisplay();
}

// Display a particular thumbnail image
function selectGalleryImage(index) {
    if (
        index < 0 ||
        index >= currentGalleryImages.length
    ) {
        return;
    }

    currentGalleryIndex = index;
    updateGalleryDisplay();
}

// Update the main image, counter and active thumbnail
function updateGalleryDisplay() {
    const mainImage = document.getElementById('galleryMainImage');
    const counter = document.getElementById('galleryCounter');
    const thumbnails = document.querySelectorAll('.gallery-thumb');

    if (!mainImage || !counter) return;

    mainImage.src = currentGalleryImages[currentGalleryIndex];

    counter.textContent =
        `${currentGalleryIndex + 1} / ${currentGalleryImages.length}`;

    thumbnails.forEach((thumbnail, index) => {
        thumbnail.classList.toggle(
            'active',
            index === currentGalleryIndex
        );
    });
}




// Create the full-screen image viewer.
function createImageLightbox() {
    if (document.getElementById('imageLightbox')) return;

    const lightbox = document.createElement('div');
    lightbox.id = 'imageLightbox';
    lightbox.className = 'image-lightbox';

    lightbox.innerHTML = `
        <button type="button"
                class="lightbox-close"
                aria-label="Close full-screen image"
                onclick="closeImageLightbox()">
            &times;
        </button>

        <button type="button"
                class="lightbox-arrow lightbox-prev"
                aria-label="Previous image"
                onclick="changeLightboxImage(-1)">
            &#10094;
        </button>

        <img id="lightboxImage" src="" alt="Full-size property image">

        <button type="button"
                class="lightbox-arrow lightbox-next"
                aria-label="Next image"
                onclick="changeLightboxImage(1)">
            &#10095;
        </button>

        <div id="lightboxCounter" class="lightbox-counter"></div>
    `;

    lightbox.addEventListener('click', function(event) {
        if (event.target === lightbox) {
            closeImageLightbox();
        }
    });

    document.body.appendChild(lightbox);
}


// Open the selected property picture in full-screen mode.
function openLightbox(index = currentGalleryIndex) {
    if (!currentGalleryImages.length) return;

    currentGalleryIndex =
        (index + currentGalleryImages.length) %
        currentGalleryImages.length;

    createImageLightbox();
    updateGalleryDisplay();

    const lightbox = document.getElementById('imageLightbox');

    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';

    updateLightboxImage();
}


// Display the selected full-size image.
function updateLightboxImage() {
    const image = document.getElementById('lightboxImage');
    const counter = document.getElementById('lightboxCounter');

    if (!image || !currentGalleryImages.length) return;

    image.src = currentGalleryImages[currentGalleryIndex];

    counter.textContent =
        `${currentGalleryIndex + 1} / ${currentGalleryImages.length}`;

    const previousButton =
        document.querySelector('.lightbox-prev');

    const nextButton =
        document.querySelector('.lightbox-next');

    const hasMultipleImages = currentGalleryImages.length > 1;

    previousButton.hidden = !hasMultipleImages;
    nextButton.hidden = !hasMultipleImages;
}


// Browse property pictures in full-screen mode.
function changeLightboxImage(direction) {
    if (currentGalleryImages.length <= 1) return;

    const total = currentGalleryImages.length;

    currentGalleryIndex =
        (currentGalleryIndex + direction + total) % total;

    updateGalleryDisplay();
    updateLightboxImage();
}


// Close the full-screen viewer.
function closeImageLightbox() {
    const lightbox = document.getElementById('imageLightbox');

    if (!lightbox) return;

    lightbox.classList.remove('open');

    // Keep the page locked if the property details modal is still open.
    const propertyModal = document.getElementById('propertyModal');

    document.body.style.overflow =
        propertyModal?.classList.contains('open') ? 'hidden' : '';
}


// Allow keyboard navigation and closing.
document.addEventListener('keydown', function(event) {
    const lightbox = document.getElementById('imageLightbox');

    if (!lightbox?.classList.contains('open')) return;

    if (event.key === 'Escape') {
        closeImageLightbox();
    } else if (event.key === 'ArrowRight') {
        changeLightboxImage(1);
    } else if (event.key === 'ArrowLeft') {
        changeLightboxImage(-1);
    }
});








function closeModal(){document.getElementById('propertyModal')?.classList.remove('open');document.body.style.overflow=''}
async function likeProperty(id){try{const r=await fetch(`${API}/properties/${id}/like`,{method:'POST'});if(r.ok){const d=await r.json();const n=document.getElementById('likes-'+id);if(n)n.textContent=d.likes;return}}catch{}const n=document.getElementById('likes-'+id);if(n)n.textContent=Number(n.textContent||0)+1}
async function shareProperty(id){const url=new URL('property-listings.html?property='+encodeURIComponent(id),location.href).href;try{if(navigator.share)await navigator.share({title:'LEKKIHOMESANDPROPERTIES listing',url});else{await navigator.clipboard.writeText(url);alert('Property link copied.')}}catch(e){}}




async function contactProperty(id) {
  const properties = await getProperties();

  const property =
    properties.find(p => String(p._id) === String(id)) ||
    sampleProperties.find(p => String(p._id) === String(id));

  if (!property) {
    alert('Property could not be found.');
    return;
  }

  // Replace this example with your actual WhatsApp business number.
  // Use country code and digits only, without + or spaces.
  const whatsappNumber = '2347084502673';

//   const propertyURL = new URL(
//     `/share/property/${encodeURIComponent(String(property._id))}`,
//     window.location.origin
//   ).href;


// const propertyURL =
//   `${API.replace(/\/api\/?$/, '')}/share/property/` +
//   encodeURIComponent(String(property._id));


  const propertyURL =
  `https://lekkihomesandproperties.com/share/property/` +
  encodeURIComponent(String(property._id));


  const message = [
    'Hello LekkiHomesAndProperties!',
    '',
    'I am interested in this property.',
    `Property: ${property.title || 'Property'}`,
    `Location: ${property.location || 'Not specified'}`,
    `Price: ${
      property.price != null
        ? money(property.price)
        : 'Contact for price'
    }`,
    '',
    `View Property: ${propertyURL}`
  ].join('\n');

  const whatsappURL =
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  window.open(whatsappURL, '_blank', 'noopener,noreferrer');
}




async function loadComments(id){const el=document.getElementById('commentList');if(!el)return;try{const r=await fetch(`${API}/properties/${id}/comments`);if(r.ok){const d=await r.json();el.innerHTML=d.comments?.length?d.comments.map(c=>`<div class="comment"><strong>${esc(c.name)}</strong><p>${esc(c.text)}</p><small>${new Date(c.createdAt).toLocaleDateString()}</small></div>`).join(''):'<p class="muted">Be the first to ask a question.</p>';return}}catch{}el.innerHTML='<p class="muted">Comments are available when the database is connected.</p>'}
async function submitComment(e,id){e.preventDefault();const name=document.getElementById('commentName').value.trim(),text=document.getElementById('commentText').value.trim();try{const r=await fetch(`${API}/properties/${id}/comments`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,text})});if(r.ok){document.getElementById('commentText').value='';loadComments(id);return}const d=await r.json();alert(d.message||'Unable to post comment.')}catch{alert('Connect the server and database to enable comments.')}}
async function startPayment(id){let email=prompt('Enter your email address for the payment receipt:');if(!email)return;try{const r=await fetch(API+'/payments/initialize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({propertyId:id,email})});const d=await r.json();if(r.ok&&d.authorization_url)location.href=d.authorization_url;else alert(d.message||'Payment setup is not configured yet. Contact our team to complete this transaction securely.')}catch{alert('Payment service is unavailable. Please contact our team.')}}
function setupMenu(){const t=document.querySelector('.menu-toggle'),n=document.querySelector('.nav-links');t?.addEventListener('click',()=>n.classList.toggle('open'));const page=location.pathname.split('/').pop()||'index.html';document.querySelectorAll('.nav-links a').forEach(a=>{if(a.getAttribute('href')===page)a.classList.add('active')})}
function setupContact(){const f=document.getElementById('contactForm');if(!f)return;const prop=new URLSearchParams(location.search).get('property');if(prop&&f.elements.subject)f.elements.subject.value='Enquiry about '+prop;f.addEventListener('submit',async e=>{e.preventDefault();const payload=Object.fromEntries(new FormData(f).entries());
    
    
    try{const r=await fetch(API+'/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(
        payload      
    
    )});
    
    
    
    const d=await r.json();if(!r.ok)throw Error(d.message);document.getElementById('contactMessage').textContent='Thank you. Your message has been received.';f.reset()}catch{document.getElementById('contactMessage').textContent='The server is not connected yet. Please email or WhatsApp our team directly.'}})}
document.addEventListener('DOMContentLoaded',()=>{setupMenu();renderProperties('featuredProperties',3);renderProperties();setupContact();if(new URLSearchParams(location.search).has('property')&&document.getElementById('propertyGrid')){const id=new URLSearchParams(location.search).get('property');setTimeout(()=>openProperty(id),500)}});






 const carousel = document.getElementById("investmentCarousel");
        const track = document.getElementById("carouselTrack");
        const viewport = carousel.querySelector(".carousel-viewport");

        const cards = Array.from(
            track.querySelectorAll(".quote-card")
        );

        const prevBtn = document.getElementById("prevBtn");
        const nextBtn = document.getElementById("nextBtn");

        const dotsContainer = document.getElementById("carouselDots");

        const currentSlideText = document.getElementById("currentSlide");
        const totalSlidesText = document.getElementById("totalSlides");

        let currentIndex = 0;
        let visibleCards = getVisibleCards();
        let maxIndex = Math.max(0, cards.length - visibleCards);

        let autoplay;

        let touchStartX = 0;
        let touchEndX = 0;

        const AUTOPLAY_DELAY = 4500;

        /* Determine how many cards fit on the screen */

        function getVisibleCards() {
            if (window.innerWidth <= 600) {
                return 1;
            }

            if (window.innerWidth <= 900) {
                return 2;
            }

            return 3;
        }

        /* Format numbers as 01, 02, 03 */

        function formatNumber(number) {
            return String(number).padStart(2, "0");
        }

        /* Create navigation dots */

        function createDots() {
            dotsContainer.innerHTML = "";

            for (let i = 0; i <= maxIndex; i++) {
                const dot = document.createElement("button");

                dot.type = "button";
                dot.classList.add("dot");

                dot.setAttribute(
                    "aria-label",
                    `Go to quote group ${i + 1}`
                );

                dot.addEventListener("click", () => {
                    currentIndex = i;
                    updateCarousel();
                    restartAutoplay();
                });

                dotsContainer.appendChild(dot);
            }
        }

        /* Calculate the position of the cards */

        function updateCarousel() {
            visibleCards = getVisibleCards();
            maxIndex = Math.max(0, cards.length - visibleCards);

            currentIndex = Math.min(
                Math.max(currentIndex, 0),
                maxIndex
            );

            const firstCard = cards[0];

            if (!firstCard) return;

            const cardWidth = firstCard.getBoundingClientRect().width;

            const trackStyles = window.getComputedStyle(track);

            const gap = parseFloat(trackStyles.columnGap) || 0;

            const offset = currentIndex * (cardWidth + gap);

            track.style.transform = `translateX(-${offset}px)`;

            /* Update active navigation dot */

            const dots = dotsContainer.querySelectorAll(".dot");

            dots.forEach((dot, index) => {
                dot.classList.toggle(
                    "active",
                    index === currentIndex
                );
            });

            /* Update slide counter */

            currentSlideText.textContent = formatNumber(
                currentIndex + 1
            );

            totalSlidesText.textContent = formatNumber(
                maxIndex + 1
            );

            /* Disable arrows at the beginning and end */

            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex === maxIndex;

            prevBtn.style.opacity =
                currentIndex === 0 ? "0.45" : "1";

            nextBtn.style.opacity =
                currentIndex === maxIndex ? "0.45" : "1";
        }

        /* Move to the next group of cards */

        function nextSlide() {
            if (currentIndex >= maxIndex) {
                currentIndex = 0;
            } else {
                currentIndex++;
            }

            updateCarousel();
        }

        /* Move to the previous group of cards */

        function previousSlide() {
            if (currentIndex <= 0) {
                currentIndex = maxIndex;
            } else {
                currentIndex--;
            }

            updateCarousel();
        }

        /* Automatic sliding */

        function startAutoplay() {
            stopAutoplay();

            autoplay = setInterval(() => {
                nextSlide();
            }, AUTOPLAY_DELAY);
        }

        function stopAutoplay() {
            clearInterval(autoplay);
        }

        function restartAutoplay() {
            stopAutoplay();
            startAutoplay();
        }

        /* Previous and next buttons */

        nextBtn.addEventListener("click", () => {
            nextSlide();
            restartAutoplay();
        });

        prevBtn.addEventListener("click", () => {
            previousSlide();
            restartAutoplay();
        });

        /* Pause automatic movement while interacting */

        carousel.addEventListener("mouseenter", stopAutoplay);

        carousel.addEventListener("mouseleave", startAutoplay);

        carousel.addEventListener("focusin", stopAutoplay);

        carousel.addEventListener("focusout", (event) => {
            if (!carousel.contains(event.relatedTarget)) {
                startAutoplay();
            }
        });

        /* Swipe support for mobile devices */

        viewport.addEventListener("touchstart", (event) => {
            touchStartX = event.changedTouches[0].screenX;
        }, { passive: true });

        viewport.addEventListener("touchend", (event) => {
            touchEndX = event.changedTouches[0].screenX;

            const swipeDistance = touchStartX - touchEndX;

            if (Math.abs(swipeDistance) > 50) {
                if (swipeDistance > 0) {
                    nextSlide();
                } else {
                    previousSlide();
                }

                restartAutoplay();
            }
        }, { passive: true });

        /* Recalculate when the browser is resized */

        let resizeTimer;

        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);

            resizeTimer = setTimeout(() => {
                visibleCards = getVisibleCards();

                maxIndex = Math.max(
                    0,
                    cards.length - visibleCards
                );

                createDots();
                updateCarousel();
            }, 150);
        });

        /* Pause autoplay when the browser tab is hidden */

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                stopAutoplay();
            } else {
                startAutoplay();
            }
        });

        /* Initialize the carousel */

        createDots();
        updateCarousel();
        startAutoplay();



        // Automatically open a property when its link is visited
document.addEventListener("DOMContentLoaded", async function () {
    const params = new URLSearchParams(window.location.search);
    const propertyId = params.get("property");

    if (!propertyId) return;

    try {
        const properties = await getProperties();

        const property = properties.find(
            p => String(p._id) === String(propertyId)
        ) || sampleProperties.find(
            p => String(p._id) === String(propertyId)
        );

        if (property) {
            await openProperty(propertyId);
        } else {
            console.warn("The requested property could not be found.");
        }
    } catch (error) {
        console.error("Could not open the requested property:", error);
    }
});

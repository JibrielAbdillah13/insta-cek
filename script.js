// File upload handling
document.getElementById('followersFile').addEventListener('change', function(e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : 'No file selected';
    document.getElementById('followersFileName').textContent = fileName;
    checkFiles();
});

document.getElementById('followingFile').addEventListener('change', function(e) {
    const fileName = e.target.files[0] ? e.target.files[0].name : 'No file selected';
    document.getElementById('followingFileName').textContent = fileName;
    checkFiles();
});

function checkFiles() {
    const followersFile = document.getElementById('followersFile').files[0];
    const followingFile = document.getElementById('followingFile').files[0];
    document.getElementById('analyzeBtn').disabled = !(followersFile && followingFile);
}

// Drag and drop functionality
const uploadAreas = document.querySelectorAll('.file-upload label');

uploadAreas.forEach(area => {
    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.style.borderColor = '#405DE6';
        area.style.backgroundColor = 'rgba(64, 93, 230, 0.05)';
    });
    
    area.addEventListener('dragleave', () => {
        area.style.borderColor = '#ddd';
        area.style.backgroundColor = 'white';
    });
    
    area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.style.borderColor = '#ddd';
        area.style.backgroundColor = 'white';
        
        const input = area.parentElement.querySelector('input');
        input.files = e.dataTransfer.files;
        
        // Trigger change event
        const event = new Event('change');
        input.dispatchEvent(event);
    });
});

// Main analysis function
document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const followersFile = document.getElementById('followersFile').files[0];
    const followingFile = document.getElementById('followingFile').files[0];
    
    try {
        const followersData = await parseJSONFile(followersFile);
        const followingData = await parseJSONFile(followingFile);
        
        const followers = extractUsernames(followersData);
        const following = extractUsernames(followingData);
        
        const unfollowers = findUnfollowers(followers, following); // They follow you but you don't follow back
        const notFollowingBack = findUnfollowers(following, followers); // You follow them but they don't follow back
        const mutualFollowers = findMutualFollowers(followers, following); // Both follow each other
        
        displayResults(followers, following, unfollowers, notFollowingBack, mutualFollowers);
        
        // Set up search functionality
        setupSearch('searchUnfollowers', 'unfollowersList', unfollowers);
        setupSearch('searchNotFollowingBack', 'notFollowingBackList', notFollowingBack);
        setupSearch('searchMutual', 'mutualList', mutualFollowers);
        
        // Show results section
        document.querySelector('.results').style.display = 'block';
        
        // Scroll to results
        document.querySelector('.results').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error("Error:", error);
        alert("Error processing files. Please make sure you uploaded the correct JSON files from Instagram.");
    }
});

function parseJSONFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(JSON.parse(e.target.result));
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
    });
}

function extractUsernames(data) {
    // Handle both followers.json (array) and following.json (object with 'relationships_following')
    if (Array.isArray(data)) {
        return data.map(user => user.string_list_data[0]?.value).filter(Boolean);
    } else if (data.relationships_following) {
        return data.relationships_following.map(user => user.string_list_data[0]?.value).filter(Boolean);
    }
    return [];
}

function findUnfollowers(listA, listB) {
    return listA.filter(user => !listB.includes(user));
}

function findMutualFollowers(listA, listB) {
    return listA.filter(user => listB.includes(user));
}

function displayResults(followers, following, unfollowers, notFollowingBack, mutualFollowers) {
    // Update stats
    document.getElementById('totalFollowers').textContent = followers.length;
    document.getElementById('totalFollowing').textContent = following.length;
    document.getElementById('unfollowersCount').textContent = notFollowingBack.length;
    document.getElementById('mutualCount').textContent = mutualFollowers.length;
    
    // Display unfollowers (accounts you don't follow back)
    const unfollowersList = document.getElementById('unfollowersList');
    if (unfollowers.length > 0) {
        unfollowersList.innerHTML = unfollowers.map(user => `
            <div class="user-item" data-username="${user.toLowerCase()}">
                <div class="user-avatar">${user.charAt(0).toUpperCase()}</div>
                <div class="user-name">@${user}</div>
                <a href="https://instagram.com/${user}" target="_blank" class="user-link">
                    Lihat <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        `).join('');
    } else {
        unfollowersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-check"></i>
                <p>You follow everyone back!</p>
            </div>
        `;
    }
    
    // Display not following back (accounts that don't follow you back)
    const notFollowingBackList = document.getElementById('notFollowingBackList');
    if (notFollowingBack.length > 0) {
        notFollowingBackList.innerHTML = notFollowingBack.map(user => `
            <div class="user-item" data-username="${user.toLowerCase()}">
                <div class="user-avatar">${user.charAt(0).toUpperCase()}</div>
                <div class="user-name">@${user}</div>
                <a href="https://instagram.com/${user}" target="_blank" class="user-link">
                    Lihat <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        `).join('');
    } else {
        notFollowingBackList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-friends"></i>
                <p>All your followers follow you back!</p>
            </div>
        `;
    }
    
    // Display mutual followers
    const mutualList = document.getElementById('mutualList');
    if (mutualFollowers.length > 0) {
        mutualList.innerHTML = mutualFollowers.map(user => `
            <div class="user-item" data-username="${user.toLowerCase()}">
                <div class="user-avatar">${user.charAt(0).toUpperCase()}</div>
                <div class="user-name">@${user}</div>
                <a href="https://instagram.com/${user}" target="_blank" class="user-link">
                    Lihat <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        `).join('');
    } else {
        mutualList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No mutual followers found</p>
            </div>
        `;
    }
}

function setupSearch(searchInputId, listContainerId, originalItems) {
    const searchInput = document.getElementById(searchInputId);
    const listContainer = document.getElementById(listContainerId);
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const items = listContainer.querySelectorAll('.user-item');
        
        if (searchTerm === '') {
            // Show all items if search is empty
            items.forEach(item => item.style.display = 'flex');
            return;
        }
        
        let hasResults = false;
        
        items.forEach(item => {
            const username = item.getAttribute('data-username');
            if (username.includes(searchTerm)) {
                item.style.display = 'flex';
                hasResults = true;
            } else {
                item.style.display = 'none';
            }
        });
        
        // Show empty state if no results
        const emptyState = listContainer.querySelector('.empty-state');
        if (emptyState) {
            if (!hasResults) {
                emptyState.style.display = 'block';
                emptyState.innerHTML = `
                    <i class="fas fa-search"></i>
                    <p>No accounts match your search</p>
                `;
            } else {
                emptyState.style.display = 'none';
            }
        }
    });
}
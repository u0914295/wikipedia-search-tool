const searchForm = document.querySelector('#search-form');
const resultsContainer = document.querySelector('#results');
const modal = document.querySelector('#modal1');
const modalClose = document.querySelector('#modal1-close');
const modalTitle = document.querySelector('#modal-title');
const modalImg = document.querySelector('#modal-img');
const modalBody = document.querySelector('#modal-body');
const readMore = document.querySelector('#read-more');



let results = [];
let currentPage = 1;
const itemsPerPage = 10;

searchForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const search = document.querySelector('#search').value;
    fetch(`https://en.wikipedia.org/w/api.php?&origin=*&action=query&list=search&srsearch=${search}&format=json&srlimit=50`)
        .then(response => response.json())
        .then(data => {
            results = data.query.search;
            displaySearchResults();
        });
});

function displaySearchResults() {
    resultsContainer.innerHTML = "";
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const resultsSubset = results.slice(startIndex, endIndex);
  
    resultsSubset.forEach((result) => {
      const pageId = result.pageid;
      fetch(
        `https://en.wikipedia.org/w/api.php?&origin=*&action=query&prop=pageprops|pageimages&pithumbsize=100&format=json&pageids=${pageId}`
      )
        .then((response) => response.json())
        .then((data) => {
          const pageInfo = data.query.pages[pageId];
          if (pageInfo.thumbnail) {
            createResultElement(result, pageInfo.thumbnail.source);
          } else {
            const imageName = pageInfo.pageprops.wikibase_item;
            if (imageName) {
              fetch(
                `https://www.wikidata.org/w/api.php?origin=*&action=wbgetclaims&format=json&entity=${imageName}&property=P18`
              )
                .then((response) => response.json())
                .then((data) => {
                  const imgTitle = data.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
                  if (imgTitle) {
                    fetch(
                      `https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&prop=imageinfo&iiprop=url&iiurlwidth=100&titles=File:${encodeURIComponent(
                        imgTitle
                      )}`
                    )
                      .then((response) => response.json())
                      .then((data) => {
                        const firstPage = Object.values(data.query.pages)[0];
                        const imgURL =
                          firstPage.imageinfo?.[0]?.thumburl;
                        if (imgURL) {
                          createResultElement(result, imgURL);
                        }
                      });
                  }
                });
            }
          }
        });
    });
  
    displayPagination();
  }

  function displayPagination() {
    const paginationContainer = document.querySelector("#pagination");
    paginationContainer.innerHTML = "";
  
    const maxPages = Math.ceil(results.length / itemsPerPage);
  
    
    const prevButton = document.createElement("button");
    prevButton.innerText = "Anterior";
    prevButton.disabled = currentPage <= 1;
    prevButton.addEventListener("click", function () {
      currentPage--;
      displaySearchResults();
    });
    paginationContainer.appendChild(prevButton);
  
    
    const nextButton = document.createElement("button");
    nextButton.innerText = "Siguiente";
    nextButton.disabled = currentPage >= maxPages;
    nextButton.addEventListener("click", function () {
      currentPage++;
      displaySearchResults();
    });
    paginationContainer.appendChild(nextButton);
  }
  

function createResultElement(result, thumbnailURL) {
    const resultElement = document.createElement('div');
    resultElement.className = 'result';
    resultElement.innerHTML = `
        <img src="${thumbnailURL}" alt="${result.title} Thumbnail">
        <div>
            <h3>${result.title}</h3>
            <p>${result.snippet}</p>
            <button data-pageid="${result.pageid}" class="more-info">More Info</button>
        </div>
    `;
    resultElement.querySelector('button').addEventListener('click', openModal);
    resultsContainer.appendChild(resultElement);
}

function openModal(event) {
    const pageId = event.target.dataset.pageid;
    fetch(`https://en.wikipedia.org/w/api.php?&origin=*&action=query&prop=pageimages|extracts&pithumbsize=300&exintro=&explaintext=&format=json&pageids=${pageId}`)
        .then(response => response.json())
        .then(data => {
            const page = Object.values(data.query.pages)[0];
            modalTitle.innerText = page.title;
            modalImg.src = page.thumbnail ? page.thumbnail.source : 'https://via.placeholder.com/300';
            modalBody.innerHTML = page.extract;
            readMore.href = `https://en.wikipedia.org?curid=${page.pageid}`;
            modal.style.display = 'block';
        });

        window.onclick = function(event) {
            if (event.target == modal) {
                closeModal();
            }
        }
}

modalClose.addEventListener('click', closeModal);

function closeModal() {
    modal.style.display = 'none';
}

const historyButton = document.querySelector('#history-button');
const historyModal = document.querySelector('#history-modal');

const historyClose = document.querySelector('#history-close');
const historyBody = document.querySelector('#history-body');


function saveSearch(query) {
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    history.unshift(query); 
    localStorage.setItem('searchHistory', JSON.stringify(history));
    updateSearchHistory();
  }
  
  
historyButton.addEventListener('click', function() {
    historyModal.style.display = 'block';
});

historyClose.addEventListener('click', function() {
    historyModal.style.display = 'none';
});


searchForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const search = document.querySelector('#search').value;
    saveSearch(search);
    
});


function updateSearchHistory() {
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    historyBody.innerHTML = '';
    history.forEach(function(search, index) {
        const searchElement = document.createElement('p');
        searchElement.textContent = search;
        searchElement.onclick = function() { 
            document.querySelector('#search').value = search; 
            searchForm.dispatchEvent(new Event('submit')); 
            historyModal.style.display = 'none'; 
            window.scrollTo(0, 0); 
        };
        historyBody.appendChild(searchElement);
    });
  }


updateSearchHistory();
import Search from "./modules/Search";
import Recipe from "./modules/Recipe";
import List from "./modules/List";
import Like from "./modules/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeview";
import * as listView from "./views/listview";
import * as likesView from "./views/likesview";
import { elements, renderLoader, clearLoader } from "./views/base";

/*
   -search object
   -current recipe object
   -shopping list object
   -liked recipes
*/

const state = {};

window.addEventListener("load", () => {
  state.likes = new Like();
  state.likes.readStorage();
  likesView.toggleLikeMenu(state.likes.getNumLikes());
  state.likes.likes.forEach((like) => likesView.renderLike(like));
});

const controlSearch = async () => {
  const query = searchView.getInput();

  if (query) {
    state.search = new Search(query);
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);
    try {
      await state.search.getResults();
      clearLoader();
      searchView.renderResults(state.search.result);
      //console.log(state.search.result);
    } catch (error) {
      alert("Something wrong with ");
    }
  }
};

const controlRecipe = async () => {
  const id = window.location.hash.replace("#", "");
  //console.log(id);

  if (id) {
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    if (state.search) searchView.highlightSelected(id);
    state.recipe = new Recipe(id);
    try {
      await state.recipe.getRecipe();
      //console.log(state.recipe);
      state.recipe.parseIngredients();
      state.recipe.calcServings();
      state.recipe.calcTime();
      // console.log(state.recipe);
      clearLoader();
      // const bool = state.likes.isLiked(id);
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      //console.log(error);
      alert("Error processing recipe");
    }
  }
};

elements.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-inline");

  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    //console.log(goToPage);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

window.addEventListener("hashchange", controlRecipe);
window.addEventListener("load", controlRecipe);

["haschange", "load"].forEach((event) =>
  window.addEventListener(event, controlRecipe)
);

const controlList = () => {
  if (!state.list) state.list = new List();

  state.recipe.ingredients.forEach((e) => {
    const item = state.list.addItem(e.count, e.unit, e.ingredient);
    listView.renderItem(item);
  });
};

elements.shopping.addEventListener("click", (e) => {
  const id = e.target.closest(".shopping__item").dataset.itemid;

  if (e.target.matches(".shopping__delete, .shopping__delete *")) {
    state.list.deleteItem(id);
    listView.deleteItem(id);
  } else if (e.target.matches(".shopping__count-value")) {
    const val = parseFloat(e.target.value);
    state.list.updateCount(id, val);
  }
});

const controlLike = () => {
  if (!state.likes) state.likes = new Like();

  const currID = state.recipe.id;

  //console.log(state.likes.isLiked(currID));

  if (!state.likes.isLiked(currID)) {
    const newLike = state.likes.addLike(
      currID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );

    likesView.toggleLikeBtn(true);
    likesView.renderLike(newLike);
    //console.log(state.likes);
  } else {
    state.likes.deleteLike(currID);
    likesView.toggleLikeBtn(false);
    likesView.deleteLike(currID);
    // likesView.renderLike(newLike);
    //console.log("abc");
    //console.log(state.likes);
  }

  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

elements.recipe.addEventListener("click", (e) => {
  if (e.target.matches(".btn-decrease, .btn-decrease *")) {
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("dec");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches(".btn-increase, .btn-increase *")) {
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches(".recipe__btn--add , .recipe__btn--add *")) {
    controlList();
  } else if (e.target.matches(".recipe__love , .recipe__love *")) {
    controlLike();
  }

  //console.log(state.recipe);
});

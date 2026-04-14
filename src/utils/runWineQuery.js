function getFieldValue(wine, field) {
    if (field === "professional_ratings") {
      if (
        !Array.isArray(wine.professional_ratings) ||
        wine.professional_ratings.length === 0
      ) {
        return null;
      }
  
      const scores = wine.professional_ratings
        .map((r) => r.score)
        .filter((score) => typeof score === "number");
  
      if (scores.length === 0) return null;
  
      return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
  
    return wine[field];
  }
  
  function matchesFilter(wine, filter) {
    const { field, operator, value } = filter;
    const fieldValue = getFieldValue(wine, field);
  
    if (fieldValue === null || fieldValue === undefined) return false;
  
    if (operator === "contains") {
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase());
    }
  
    if (operator === "equals") {
      if (typeof fieldValue === "number") {
        return fieldValue === Number(value);
      }
      return String(fieldValue).toLowerCase() === String(value).toLowerCase();
    }
  
    if (operator === "lt") return Number(fieldValue) < Number(value);
    if (operator === "lte") return Number(fieldValue) <= Number(value);
    if (operator === "gt") return Number(fieldValue) > Number(value);
    if (operator === "gte") return Number(fieldValue) >= Number(value);
  
    return false;
  }
  
  export default function runWineQuery(query, wines) {
    if (!query || !Array.isArray(wines)) {
      return {
        answer: "Invalid query or wine data.",
        matches: [],
      };
    }
  
    if (query.intent === "unsupported") {
      return {
        answer:
          "I can only answer questions grounded in the provided wine dataset.",
        matches: [],
      };
    }
  
    let results = [...wines];
  
    if (Array.isArray(query.filters)) {
      results = results.filter((wine) =>
        query.filters.every((filter) => matchesFilter(wine, filter))
      );
    }
  
    if (query.sort && query.sort.field && query.sort.field !== "none") {
      results.sort((a, b) => {
        const aVal = getFieldValue(a, query.sort.field);
        const bVal = getFieldValue(b, query.sort.field);
  
        const aSafe = aVal ?? -Infinity;
        const bSafe = bVal ?? -Infinity;
  
        if (query.sort.order === "asc") {
          return aSafe > bSafe ? 1 : aSafe < bSafe ? -1 : 0;
        }
  
        if (query.sort.order === "desc") {
          return aSafe < bSafe ? 1 : aSafe > bSafe ? -1 : 0;
        }
  
        return 0;
      });
    }
  
    const limit = query.limit || 5;
    const matches = results.slice(0, limit);
  
    if (matches.length === 0) {
      return {
        answer: "I couldn’t find any wines matching that request in the dataset.",
        matches: [],
      };
    }
  
    return {
      answer: query.explanation || "Here are the matching wines from the dataset.",
      matches,
    };
  }
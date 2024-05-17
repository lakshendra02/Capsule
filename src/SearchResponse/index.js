import React, { useState } from 'react';
import { BiArrowBack, BiSearch } from "react-icons/bi";
import './style.css';

const SaltForm = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [saltSuggestions, setSaltSuggestions] = useState([]);
  const [selectedForms, setSelectedForms] = useState({});
  const [selectedStrengths, setSelectedStrengths] = useState({});
  const [selectedPackings, setSelectedPackings] = useState({});
  const [lowestPrices, setLowestPrices] = useState({});
  const [showAllForms, setShowAllForms] = useState(false); // State to toggle form buttons visibility
  const [showAllStrengths, setShowAllStrengths] = useState(false); // State to toggle strength buttons visibility
  const [showAllPackings, setShowAllPackings] = useState(false); // State to toggle packing buttons visibility
  const [onHome, setOnHome] = useState(true);

  const fetchSaltSuggestions = async () => {
    if (!searchTerm) return;

    const pharmacyIds = '1,2,3';
    const apiUrl = `https://backend.cappsule.co.in/api/v1/new_search?q=${searchTerm}&pharmacyIds=${pharmacyIds}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();
      const suggestions = data.data.saltSuggestions;
      setSaltSuggestions(suggestions);
      initializeSelectedState(suggestions);

    } catch (error) {
      console.error('Error fetching salt suggestions:', error);
    }
  };

  const initializeSelectedState = (suggestions) => {
    const initialSelectedForms = {};
    const initialSelectedStrengths = {};
    const initialSelectedPackings = {};
    const initialLowestPrices = {};

    suggestions.forEach((salt, index) => {
      const defaultForm = salt.available_forms[0];
      initialSelectedForms[index] = defaultForm;

      const defaultStrength = Object.keys(salt.salt_forms_json[defaultForm])[0];
      initialSelectedStrengths[index] = defaultStrength;

      const defaultPacking = Object.keys(salt.salt_forms_json[defaultForm][defaultStrength])[0];
      initialSelectedPackings[index] = defaultPacking;

      const defaultPrice = salt.salt_forms_json[defaultForm][defaultStrength][defaultPacking]?.[0]?.selling_price || null;
      initialLowestPrices[index] = defaultPrice;
    });

    setSelectedForms(initialSelectedForms);
    setSelectedStrengths(initialSelectedStrengths);
    setSelectedPackings(initialSelectedPackings);
    setLowestPrices(initialLowestPrices);
  };

  const handleSearchClick = () => {
    fetchSaltSuggestions();
    setOnHome(false);
  };

  const resetSearch = () => {
    setSearchTerm('');
    setSaltSuggestions([]);
    setSelectedForms({});
    setSelectedStrengths({});
    setSelectedPackings({});
    setLowestPrices({});
    setOnHome(true);
  };

  const handleFormClick = (form, index) => {
    setSelectedForms({ ...selectedForms, [index]: form });
    setSelectedStrengths({ ...selectedStrengths, [index]: null }); // Reset strength when form changes
    setSelectedPackings({ ...selectedPackings, [index]: null }); // Reset packing when form changes
    if (!saltSuggestions[index].salt_forms_json[form]) {
      setLowestPrices({ ...lowestPrices, [index]: 'Selected medicine is not available' });
    } else {
      setLowestPrices({ ...lowestPrices, [index]: null }); // Reset lowest price when form changes
    }
  };

  const handleStrengthClick = (strength, index) => {
    setSelectedStrengths({ ...selectedStrengths, [index]: strength });
    setSelectedPackings({ ...selectedPackings, [index]: null }); // Reset packing when strength changes
    if (!saltSuggestions[index].salt_forms_json[selectedForms[index]][strength]) {
      setLowestPrices({ ...lowestPrices, [index]: 'Selected medicine is not available' });
    } else {
      setLowestPrices({ ...lowestPrices, [index]: null }); // Reset lowest price when strength changes
    }
  };

  const handlePackingClick = (packing, index) => {
    setSelectedPackings({ ...selectedPackings, [index]: packing });
    calculateLowestPrice(index);
  };

  const calculateLowestPrice = (index) => {
    const selectedSalt = saltSuggestions[index];
    const form = selectedForms[index];
    const strength = selectedStrengths[index];
    const packing = selectedPackings[index];

    // If either strength or packing is null, display a message
    if (!strength || !packing) {
      setLowestPrices({ ...lowestPrices, [index]: 'Selected medicine is not available' });
      return;
    }

    const priceData = selectedSalt.salt_forms_json[form][strength][packing];

    if (!priceData) {
      setLowestPrices({ ...lowestPrices, [index]: 'Selected packing is not available' });
      return;
    }

    // Filter out null prices and get the lowest price
    let lowestPrice = null;
    Object.values(priceData).forEach((product) => {
      if (Array.isArray(product)) {
        product.forEach((entry) => {
          if (entry && typeof entry.selling_price === 'number') {
            if (lowestPrice === null || entry.selling_price < lowestPrice) {
              lowestPrice = entry.selling_price;
            }
          }
        });
      }
    });

    if (lowestPrice === null) {
      setLowestPrices({ ...lowestPrices, [index]: 'No valid price available for selected packing' });
    } else {
      setLowestPrices({ ...lowestPrices, [index]: lowestPrice });
    }
  };

  // Function to toggle visibility of form buttons
  const toggleFormsVisibility = () => {
    setShowAllForms(!showAllForms);
  };

  const toggleStrengthsVisibility = () => {
    setShowAllStrengths(!showAllStrengths);
  };

  const togglePackingsVisibility = () => {
    setShowAllPackings(!showAllPackings);
  };

  function getButtonClass(isSelected, isAvailable) {
    if (isSelected && isAvailable) {
      return 'selected-available';
    } else if (isSelected && !isAvailable) {
      return 'selected-notAvailable';
    } else if (!isSelected && isAvailable) {
      return 'notSelected-Available';
    } else {
      return 'notSelected-notAvailable';
    }
  }

  return (
    <div>
      <div className='form'>
        <button className="back--button" onClick={resetSearch}>
          {onHome ? <BiSearch /> : <BiArrowBack />}
        </button>
        <input
          className="form-input"
          type="text"
          placeholder="Enter search term"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="search--button" onClick={handleSearchClick}>Search</button>
      </div>
      {onHome ? <p className='home-text'>Find medicines with amazing discount</p> : null}

      {saltSuggestions.map((salt, index) => (
        <div className='salt-box' key={index}>
          <div className='selection-box'>
            <div className='selection'>
              <div className='selection-type'>Form:</div>
              <div className='button'>
                {salt.available_forms.slice(0, showAllForms ? salt.available_forms.length : 2).map((form, formIndex) => {
                  const isSelected = selectedForms[index] === form;
                  const isAvailable = Boolean(salt.salt_forms_json[form]);
                  const buttonClass = getButtonClass(isSelected, isAvailable);
                  return (
                    <button
                      key={formIndex}
                      onClick={() => handleFormClick(form, index)}
                      className={buttonClass}
                    >
                      {form}
                    </button>
                  );
                })}
                {salt.available_forms.length > 2 && (
                  <button className="toggle-button" onClick={toggleFormsVisibility}>
                    {showAllForms ? 'hide...' : 'more...'}
                  </button>
                )}
              </div>
            </div>

            {selectedForms[index] && (
              <div className='selection'>
                <div className='selection-type'>Strength:</div>
                <div className='button'>
                  {Object.keys(salt.salt_forms_json[selectedForms[index]]).slice(0, showAllStrengths ?
                    Object.keys(salt.salt_forms_json[selectedForms[index]]).length : 2)
                    .map((strength, strengthIndex) => {
                      const isSelected = selectedStrengths[index] === strength;
                      const isAvailable = Boolean(salt.salt_forms_json[selectedForms[index]][strength]);
                      const buttonClass = getButtonClass(isSelected, isAvailable);
                      return (
                        <button
                          key={strengthIndex}
                          onClick={() => handleStrengthClick(strength, index)}
                          className={buttonClass}
                        >
                          {strength}
                        </button>
                      );
                    })}
                  {Object.keys(salt.salt_forms_json[selectedForms[index]]).length > 2 && (
                    <button className="toggle-button" onClick={toggleStrengthsVisibility}>
                      {showAllStrengths ? 'hide...' : 'more...'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {selectedStrengths[index] && (
              <div className='selection'>
                <div className='selection-type'>Packing:</div>
                <div className='button'>
                  {Object.keys(salt.salt_forms_json[selectedForms[index]][selectedStrengths[index]]).slice(0, showAllPackings ?
                    Object.keys(salt.salt_forms_json[selectedForms[index]][selectedStrengths[index]]).length : 2)
                    .map((packing, packingIndex) => {
                      const isSelected = selectedPackings[index] === packing;
                      const isAvailable = Boolean(salt.salt_forms_json[selectedForms[index]][selectedStrengths[index]][packing]);
                      const buttonClass = getButtonClass(isSelected, isAvailable);
                      return (
                        <button
                          key={packingIndex}
                          onClick={() => handlePackingClick(packing, index)}
                          className={buttonClass}
                        >
                          {packing}
                        </button>
                      );
                    })}
                  {Object.keys(salt.salt_forms_json[selectedForms[index]][selectedStrengths[index]]).length > 2 && (
                    <button className="toggle-button" onClick={togglePackingsVisibility}>
                      {showAllPackings ? 'hide...' : 'more...'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className='selected-result'>
            <h3>{salt.salt}</h3>
            <div className='result'>
              <p>{selectedForms[index]} |</p>
              <p>{selectedStrengths[index]} |</p>
              <p>{selectedPackings[index]}</p>
            </div>
          </div>

          <div className='price'>
            {lowestPrices[index] && (
              <div>
                {typeof lowestPrices[index] === 'number' ?
                  `From ₹${lowestPrices[index]}` :
                  lowestPrices[index]}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default SaltForm;

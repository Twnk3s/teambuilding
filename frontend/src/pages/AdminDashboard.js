import React, { useState, useEffect, useCallback } from 'react';
// Import the relevant API functions
import {
    fetchDestinations,
    addDestination,
    updateDestination,
    deleteDestination,
    fetchAdminVoteDetails // Function to get detailed vote data
} from '../services/api';
// Import child components
import AdminDestinationForm from '../components/AdminDestinationForm';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
    // --- State Management ---
    // Destinations Data
    const [destinations, setDestinations] = useState([]);
    const [loadingDestinations, setLoadingDestinations] = useState(true); // Loading state specific to destinations
    const [destinationsError, setDestinationsError] = useState(null);     // Error state specific to destinations
    const [editingDestination, setEditingDestination] = useState(null);   // Holds destination data when editing

    // Vote Details Data
    const [voteDetails, setVoteDetails] = useState([]);
    const [loadingVotes, setLoadingVotes] = useState(false); // Loading state specific to votes (initially false)
    const [votesError, setVotesError] = useState(null);     // Error state specific to votes
    const [showVotes, setShowVotes] = useState(false);      // Controls visibility of the vote details section

    // --- Data Fetching ---

    // Fetch list of destinations
    const loadDestinations = useCallback(async () => {
        console.log('[AdminDashboard - loadDestinations] Fetching destinations...');
        setLoadingDestinations(true);
        setDestinationsError(null); // Clear previous errors
        try {
            const response = await fetchDestinations();
            console.log('[AdminDashboard - loadDestinations] API Response:', response.data);
            // Ensure response.data.data is an array or default to empty array
            setDestinations(Array.isArray(response.data?.data) ? response.data.data : []);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to load destinations.';
            console.error("Admin Load Destinations Error:", errorMsg);
            setDestinationsError(errorMsg);
            setDestinations([]); // Clear destinations on error
        } finally {
            console.log('[AdminDashboard - loadDestinations] Setting loadingDestinations=false.');
            setLoadingDestinations(false);
        }
    }, []); // Empty dependency array - function created once

    // Effect to load destinations on initial component mount
    useEffect(() => {
        loadDestinations();
    }, [loadDestinations]); // Dependency array includes the memoized function reference

    // Fetch detailed vote information (toggle function)
    const handleToggleVoteDetails = useCallback(async () => {
        // If currently hidden, we fetch and show
        if (!showVotes) {
            setShowVotes(true); // Show section (spinner will appear)
            setLoadingVotes(true);
            setVotesError(null);
            console.log('[AdminDashboard - handleToggleVoteDetails] Fetching vote details...');
            try {
                const response = await fetchAdminVoteDetails(); // API call
                console.log("[AdminDashboard - handleToggleVoteDetails] API Response:", response.data);
                // Ensure response.data.data is an array
                setVoteDetails(Array.isArray(response.data?.data) ? response.data.data : []);
            } catch (err) {
                const errorMsg = err.response?.data?.message || err.message || 'Failed to load vote details.';
                console.error("[AdminDashboard - handleToggleVoteDetails] API Error:", errorMsg);
                setVotesError(errorMsg);
                setShowVotes(false); // Hide section again on error
            } finally {
                console.log('[AdminDashboard - handleToggleVoteDetails] Setting loadingVotes=false.');
                setLoadingVotes(false);
            }
        } else {
            // If currently shown, just hide the section
            console.log('[AdminDashboard - handleToggleVoteDetails] Hiding votes.');
            setShowVotes(false);
            setVotesError(null); // Clear any previous vote errors
            // Optional: Clear data when hiding to free memory if list is large
            // setVoteDetails([]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showVotes]); // Dependency includes showVotes to correctly toggle


    // --- Destination CRUD Handlers ---

    const handleAddSubmit = useCallback(async (formData) => {
        console.log("[AdminDashboard - handleAddSubmit] Attempting add:", formData);
        setDestinationsError(null); // Clear previous errors
        // Note: We don't set loadingDestinations=true here, loadDestinations will handle it
        // This prevents brief spinner flash if add is very fast. Consider adding specific 'isSubmitting' state if needed.
        try {
            await addDestination(formData); // Call API
            setEditingDestination(null);    // Reset form state (via key prop on form)
            await loadDestinations();     // Refresh the list
            console.log("[AdminDashboard - handleAddSubmit] Add successful.");
        } catch (err) {
             const errorMsg = err.response?.data?.message || err.message || 'Failed to add destination.';
             console.error("Admin Add Destination Error:", errorMsg);
             setDestinationsError(errorMsg);
             // No need to set loading false here if loadDestinations wasn't awaited fully or handled loading itself
        }
    }, [loadDestinations]); // Depends on loadDestinations

    const handleEditSubmit = useCallback(async (formData) => {
         if (!editingDestination?._id) return; // Check if editing state is valid
         console.log("[AdminDashboard - handleEditSubmit] Attempting update:", editingDestination._id, formData);
         setDestinationsError(null);
         // Similar to add, consider specific 'isSubmitting' state vs relying on loadDestinations loading
         try {
             await updateDestination(editingDestination._id, formData); // Call API
             setEditingDestination(null); // Reset form state
             await loadDestinations();    // Refresh list
             console.log("[AdminDashboard - handleEditSubmit] Update successful.");
         } catch (err) {
              const errorMsg = err.response?.data?.message || err.message || 'Failed to update destination.';
              console.error("Admin Update Destination Error:", errorMsg);
              setDestinationsError(errorMsg);
         }
    }, [editingDestination, loadDestinations]); // Depends on editingDestination and loadDestinations

     const handleDelete = useCallback(async (id, name) => { // Pass name for confirmation dialog
        console.log("[AdminDashboard - handleDelete] Attempting delete:", id);
        // Use name in confirmation for better UX
        if (window.confirm(`Are you sure you want to delete "${name}"? This will also remove all votes for it.`)) {
            setDestinationsError(null);
            // Consider specific 'isDeleting' state or rely on loadDestinations loading
            try {
                await deleteDestination(id); // Call API
                await loadDestinations(); // Refresh list
                console.log("[AdminDashboard - handleDelete] Delete successful for:", id);
                // Clear form if the deleted item was being edited
                if (editingDestination?._id === id) {
                     setEditingDestination(null);
                }
            } catch (err) {
                const errorMsg = err.response?.data?.message || err.message || 'Failed to delete destination.';
                console.error("Admin Delete Destination Error:", errorMsg);
                setDestinationsError(errorMsg);
            }
        } else {
             console.log("[AdminDashboard - handleDelete] Delete cancelled by user for:", id);
        }
    }, [editingDestination, loadDestinations]); // Depends on editingDestination and loadDestinations

    // Handler to set the state for editing a destination
    const handleEditClick = useCallback((destination) => {
        console.log("[AdminDashboard - handleEditClick] Set editing destination:", destination.name);
        setEditingDestination(destination); // Set data for the form
        // Scroll form into view smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []); // No dependencies needed

    // Handler to cancel editing mode
     const handleCancelEdit = useCallback(() => {
         console.log("[AdminDashboard - handleCancelEdit] Cancelling edit.");
         setEditingDestination(null); // Clear editing data (resets form via key/useEffect)
         setDestinationsError(null);  // Clear any lingering errors from potential failed updates
     }, []); // No dependencies needed

    // --- Render ---
    return (
        <div className="container">
            <h1 className="my-2 text-center">Admin Dashboard</h1>

            {/* === Destination Management Section === */}
            <section className="mb-2">
                <h2 className="my-2">Manage Destinations</h2>
                {/* Display destination-related errors */}
                {destinationsError && <div className="alert alert-danger">{destinationsError}</div>}

                {/* Destination Add/Edit Form */}
                <AdminDestinationForm
                    // Unique key forces component re-mount and state reset when switching add/edit
                    key={editingDestination?._id || 'add-destination-form'}
                    onSubmit={editingDestination ? handleEditSubmit : handleAddSubmit}
                    initialData={editingDestination} // Pass current destination data if editing, null otherwise
                    onCancel={handleCancelEdit}       // Pass cancel handler
                    // Indicate loading state for disabling form elements during submit/update
                    isLoading={loadingDestinations && !destinations.length} // Simple loading state for form disable, refine if needed
                />

                <hr className='my-2' />

                {/* Table of Existing Destinations */}
                <h3 className="my-2">Existing Destinations</h3>
                {/* Show spinner only during initial destination load */}
                {loadingDestinations && destinations.length === 0 && <LoadingSpinner />}
                {/* Show message if loaded but no destinations found */}
                {!loadingDestinations && destinations.length === 0 && !destinationsError && (
                    <p className="text-center">No destinations have been added yet.</p>
                )}
                {/* Render table if destinations exist */}
                {destinations.length > 0 && (
                     <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th className='name-cell'>Name</th>
                                    <th className='location-cell'>Location</th>
                                    <th className='cost-cell'>Cost (RON)</th>
                                    <th className="description-cell">Description</th>
                                    <th className='image-cell'>Image URL</th>
                                    <th className="actions-cell">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {destinations.map(dest => (
                                    <tr key={dest._id}>
                                         <td className='name-cell'>{dest.name}</td>
                                         <td className='location-cell'>{dest.location}</td>
                                         <td className='cost-cell'>{dest.cost?.toLocaleString() ?? 'N/A'}</td>
                                         <td className="description-cell">{dest.description}</td>
                                         <td className='image-cell'>
                                            {dest.imageUrl ? (
                                                <a href={dest.imageUrl} target="_blank" rel="noopener noreferrer" title={dest.imageUrl}>
                                                    {/* Shorten URL for display */}
                                                    {dest.imageUrl.length > 40 ? `${dest.imageUrl.substring(0, 40)}...` : dest.imageUrl}
                                                </a>
                                            ) : (
                                                <i>None</i>
                                            )}
                                         </td>
                                         <td className="actions-cell">
                                            {/* Disable buttons during any destination operation */}
                                            <button onClick={() => handleEditClick(dest)} className="btn btn-secondary btn-sm" disabled={loadingDestinations}>Edit</button>
                                            <button onClick={() => handleDelete(dest._id, dest.name)} className="btn btn-danger btn-sm" disabled={loadingDestinations}>Delete</button>
                                         </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <hr className='my-2' />

            {/* === Vote Details Section === */}
            <section>
                <h2 className="my-2">Vote Details</h2>
                {/* Button to toggle visibility and fetch data */}
                <button
                    onClick={handleToggleVoteDetails}
                    className={`btn ${showVotes ? 'btn-secondary' : 'btn-info'} mb-1`} // Change color based on state
                    disabled={loadingVotes} // Disable only while votes are actively loading
                >
                     {loadingVotes ? 'Loading Votes...' : showVotes ? 'Hide Vote Details' : 'Show Vote Details'}
                </button>

                {/* Conditional rendering block for vote details table/messages */}
                {showVotes && ( // Only render content below if showVotes is true
                    <div className="mt-1"> {/* Add margin top to content */}
                        {loadingVotes && <LoadingSpinner />}
                        {/* Show vote-specific errors only when not loading */}
                        {votesError && !loadingVotes && <div className="alert alert-danger">{votesError}</div>}
                        {/* Show message if loaded, no errors, but no votes found */}
                        {!loadingVotes && !votesError && voteDetails.length === 0 && (
                            <p>No votes have been cast yet.</p>
                        )}
                        {/* Render vote details table if loaded, no errors, and votes exist */}
                        {!loadingVotes && !votesError && voteDetails.length > 0 && (
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>User Name</th> {/* Changed from Email */}
                                            <th>Voted For Destination</th>
                                            <th>Location</th>
                                            <th>Date Voted</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {voteDetails.map(vote => (
                                            <tr key={vote._id}>
                                                {/* Use optional chaining and nullish coalescing for safety */}
                                                <td>{vote.user?.name ?? 'User Data Unavailable'}</td> {/* Display user name */}
                                                <td>{vote.destination?.name ?? 'Destination Data Unavailable'}</td>
                                                <td>{vote.destination?.location ?? '-'}</td>
                                                {/* Format date/time based on locale */}
                                                <td>{vote.createdAt ? new Date(vote.createdAt).toLocaleString() : 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </section>

        </div> // End container div
    );
};

export default AdminDashboard;
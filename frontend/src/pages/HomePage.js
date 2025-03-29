import React, { useState, useEffect, useCallback } from 'react';
// Fetch only vote results now, as it includes destination details
import { fetchVoteResults, castVote } from '../services/api';
import useAuth from '../hooks/useAuth';
import DestinationCard from '../components/DestinationCard';
import LoadingSpinner from '../components/LoadingSpinner';

const HomePage = () => {
    // State:
    // 'displayData' holds the array of objects received from /api/votes/results
    // Each object should contain { destinationId, name, location, ..., voteCount, votingDeadline }
    const [displayData, setDisplayData] = useState([]);
    const [userVoteId, setUserVoteId] = useState(null); // User's voted destination ID
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState(null);
    const { user, loading: authLoading, error: authError, setError: setAuthError } = useAuth();

    // --- Data Loading ---
    const loadData = useCallback(async () => {
        console.log('[HomePage - loadData] Fetching vote results...');
        setLoading(true);
        setPageError(null); // Clear page error on load attempt
        if (authError) setAuthError(null); // Clear auth error

        try {
            // Only fetch /api/votes/results as it now contains all needed info
            const response = await fetchVoteResults();
            console.log('[HomePage - loadData] API Response:', response.data);

            if (response.data?.success) {
                // Use the 'results' array directly for display data
                setDisplayData(Array.isArray(response.data.results) ? response.data.results : []);
                // Set the user's vote ID from the response
                setUserVoteId(response.data.userVote || null);
                console.log('[HomePage - loadData] Data set. UserVoteId:', response.data.userVote || 'null');
            } else {
                 throw new Error(response.data?.message || 'Failed to load results data structure.');
            }

            // --- Handle Destinations with Zero Votes ---
            // The /results endpoint only returns destinations WITH votes.
            // If you want to show destinations with ZERO votes, you'd need a separate
            // fetchDestinations() call and merge the data.
            // For simplicity now, we only show destinations with at least one vote OR
            // we modify the backend /results endpoint to include zero-vote destinations.
            // --- Let's assume for now we only show voted destinations ---
            // If you NEED zero-vote destinations shown:
            // 1. Add back fetchDestinations() call in Promise.all
            // 2. Merge results: Create a map of vote counts from resultsRes.
            // 3. Map over destRes.data.data, adding voteCount from the map (default 0).
            // 4. Set this merged array to setDisplayData.

        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to load destination or vote data.';
            console.error("HomePage Load Data Error:", errorMsg);
            setPageError(errorMsg);
            setDisplayData([]); // Clear data on error
            setUserVoteId(null);
        } finally {
            console.log('[HomePage - loadData] Setting loading=false.');
            setLoading(false);
        }
     // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authError, setAuthError]); // Dependencies for clearing context error

    // Load data on mount
    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- Voting Handler ---
    const handleVote = useCallback(async (destinationId) => {
        console.log('[HomePage - handleVote] Vote attempt for:', destinationId);
        // Clear errors before attempting vote
        setPageError(null);
        if (authError) setAuthError(null);

        // Basic checks (should be handled by button state, but good safeguard)
        if (!user) {
            setPageError("Please log in to vote.");
            // Consider redirecting: navigate('/login', { state: { from: location } });
            return;
        }
        if (userVoteId) {
             setPageError("You have already cast your vote.");
             return;
        }
        // Deadline check is now handled by DestinationCard's disabled state + backend validation

        // Set loading state specifically for voting? (Optional)
        // const optimisticVoteCount = (voteResults[destinationId] || 0) + 1; // Example optimistic update
        // setVoteResults(prev => ({ ...prev, [destinationId]: optimisticVoteCount }));
        // setUserVoteId(destinationId); // Optimistic update

        try {
            await castVote(destinationId); // Call API
            console.log('[HomePage - handleVote] Vote cast successfully. Reloading data...');
            // Refresh data to get latest counts and user vote status
            await loadData();

        } catch (err) {
             const errorMsg = err.response?.data?.message || err.message || 'Failed to cast vote. Please try again.';
             console.error("HomePage Handle Vote Error:", errorMsg);
             setPageError(errorMsg);
             // Revert optimistic updates if they were implemented
             // E.g., call loadData() again or manually revert state changes
             // await loadData(); // Easiest way to revert is often just reload
        } finally {
             // Clear specific voting loading state if used
        }
    }, [user, userVoteId, loadData, authError, setAuthError]); // Dependencies for handleVote

    // Combine loading states
    const isLoading = loading || authLoading;

    // --- Render Logic ---
    return (
        <div className="container">
            <h1 className="text-center my-3">Vote for Your Next Team Trip!</h1> {/* Adjusted margin */}

            {/* Display loading spinner */}
            {isLoading && <LoadingSpinner />}

            {/* Display errors (show page error first, then auth error if page error is null) */}
            {!isLoading && (pageError || authError) && (
                 <div className="alert alert-danger mb-3">{pageError || authError}</div>
             )}

            {/* Message if no destinations are available (loaded, no error, but empty) */}
            {!isLoading && !pageError && !authError && displayData.length === 0 && (
                <p className="text-center my-4">
                    No destinations currently available for voting, or none have received votes yet. Check back later or contact an admin!
                </p> // Adjusted message
            )}

            {/* Render destination cards grid */}
            {!isLoading && !pageError && !authError && displayData.length > 0 && (
                <div className="grid-container">
                    {displayData.map(item => (
                        // --- Pass data to DestinationCard ---
                        // The 'item' object from /api/votes/results should now contain:
                        // destinationId, name, location, imageUrl, cost, description, votingDeadline, voteCount
                        <DestinationCard
                            // Use destinationId as key
                            key={item.destinationId}
                            // Pass the whole item as 'destination' prop, as DestinationCard expects it
                            // Alternatively, restructure DestinationCard to accept individual props
                            destination={{
                                _id: item.destinationId, // Pass ID as _id
                                name: item.name,
                                location: item.location,
                                cost: item.cost,
                                description: item.description,
                                imageUrl: item.imageUrl,
                                votingDeadline: item.votingDeadline // Pass deadline
                            }}
                            // Pass the specific vote count for this destination
                            voteCount={item.voteCount}
                            // Pass the vote handler
                            onVote={handleVote}
                            // Pass the ID of the destination the user voted for (or null)
                            userVoteId={userVoteId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default HomePage;
import React, { useMemo } from 'react'; // Import useMemo
import useAuth from '../hooks/useAuth';

// Assuming relevant CSS classes are defined elsewhere (e.g., App.css, index.css)

/**
 * Represents a single destination card display.
 * Handles image loading/errors, displays destination details,
 * calculates/shows cost per voter, shows voting deadline status,
 * and renders the appropriate voting action/status based on user auth,
 * prior votes, and the deadline.
 */
const DestinationCard = ({ destination, voteCount = 0, onVote, userVoteId }) => {
    // --- Hooks ---
    const { user, loading: authLoading } = useAuth(); // Get authentication context

    // --- Memoized Derived State ---
    // Memoize derived values to prevent recalculation on every render unless dependencies change
    const cardData = useMemo(() => {
        // Basic validation: Return null if essential data is missing to prevent render errors
        if (!destination?._id || !destination.name) {
            console.warn("DestinationCard computed data skipped: Invalid destination prop.");
            return null;
        }

        // Process Deadline
        let deadline = null;
        let hasDeadlinePassed = false;
        let deadlineText = '';
        if (destination.votingDeadline) {
            try {
                const deadlineDate = new Date(destination.votingDeadline);
                if (!isNaN(deadlineDate.getTime())) {
                    deadline = deadlineDate; // Store valid Date object
                    hasDeadlinePassed = new Date() > deadline;
                    deadlineText = `Voting ${hasDeadlinePassed ? 'Closed' : 'Closes'}: ${deadline.toLocaleString()}`;
                } else {
                    console.warn(`Invalid deadline format for ${destination.name}: ${destination.votingDeadline}`);
                }
            } catch (e) {
                console.error(`Error parsing deadline for ${destination.name}: ${destination.votingDeadline}`, e);
            }
        }

        // Process Costs
        const totalCost = destination.cost;
        const voters = voteCount ?? 0;
        let costPerPerson = null;
        let costPerPersonText = '';
        if (typeof totalCost === 'number' && totalCost >= 0) {
            if (voters > 0) {
                costPerPerson = totalCost / voters;
                costPerPersonText = `Est. Cost / Voter: $${costPerPerson.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            } else {
                 costPerPersonText = '(Cost / voter calculated after first vote)';
            }
        } else {
            costPerPersonText = '(Total cost unavailable)';
        }
        const totalCostText = typeof totalCost === 'number' ? `$${totalCost.toLocaleString()}` : 'N/A';


        // Process Image URL
        const imageUrl = destination.imageUrl || null;

        // Voting Status
        const hasVotedForThis = userVoteId === destination._id;
        const canVote = user && !userVoteId && !hasDeadlinePassed; // Conditions required to show 'Vote' button active
        const voteButtonDisabled = authLoading || !!userVoteId || hasDeadlinePassed;

        // Determine Vote Button Text and Title
        let voteButtonText = 'Vote';
        let voteButtonTitle = `Vote for ${destination.name}`;
        if (hasDeadlinePassed) {
            voteButtonText = 'Voting Closed';
            voteButtonTitle = 'Voting for this destination has closed.';
        } else if (hasVotedForThis) {
            voteButtonText = 'Voted';
            voteButtonTitle = 'You voted for this destination.';
        } else if (userVoteId) {
            voteButtonText = 'Vote Locked';
            voteButtonTitle = 'You have already cast your vote for another destination.';
        }

        // Determine Vote Button CSS Class
        let voteButtonClass = 'btn btn-primary btn-sm';
        if (hasDeadlinePassed) {
            voteButtonClass = 'btn btn-secondary btn-sm';
        } else if (hasVotedForThis) {
            voteButtonClass = 'btn btn-success btn-sm';
        }

        // Card Classes
        const cardClasses = `destination-card h-100 ${hasDeadlinePassed ? 'deadline-passed' : ''}`;

        return {
            // Raw data needed for rendering
            id: destination._id,
            name: destination.name,
            location: destination.location || 'Unknown Location',
            description: destination.description || 'No description available.',
            // Processed data
            imageUrl,
            totalCostText,
            costPerPersonText,
            deadlineText,
            hasDeadlinePassed,
            voters,
            // Vote action state
            hasVotedForThis,
            canVote, // Not strictly needed with disabled logic, but good for clarity
            voteButtonDisabled,
            voteButtonText,
            voteButtonTitle,
            voteButtonClass,
            cardClasses,
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [destination, voteCount, userVoteId]); // Recalculate only when these props change

    // --- Event Handlers ---
    const handleImageError = (e) => {
       console.warn(`Image failed to load: ${e.target.src}`);
       const imgElement = e.target;
       const container = imgElement.closest('.card-img-top'); // Find container
       const placeholderElement = container?.querySelector('.img-placeholder');

       imgElement.style.display = 'none'; // Hide broken image
       if (placeholderElement) {
           placeholderElement.style.display = 'flex'; // Show placeholder
       }
    };

    const handleVoteClick = () => {
        // Double check conditions before calling onVote prop
        if (!cardData.voteButtonDisabled && cardData.id) {
            onVote(cardData.id);
        }
    }

    // --- Render Logic ---
    // If essential data couldn't be processed, render nothing or an error placeholder
    if (!cardData) {
        return null; // Or <div className="destination-card error">Invalid Data</div>
    }

    return (
        <div className={cardData.cardClasses}>
            {/* Image Container */}
            <div className="card-img-top">
                {cardData.imageUrl ? (
                    <img
                        src={cardData.imageUrl}
                        alt={`${cardData.name || 'Destination'} image`} // Use processed name
                        loading="lazy" // Add lazy loading for images
                        onError={handleImageError}
                        // onLoad can be tricky with lazy loading, might remove or refine
                    />
                ) : null}
                {/* Placeholder Div */}
                <div className="img-placeholder" style={{ display: cardData.imageUrl ? 'none' : 'flex' }}>
                    No Image Provided
                </div>
            </div>

            {/* Card Content */}
            <div className="destination-card-content">
                <div> {/* Content wrapper */}
                    <h3>{cardData.name}</h3>
                    <p className="location">{cardData.location}</p>
                    <p className="cost">Total Est. Cost: {cardData.totalCostText}</p>
                    <p className="cost-per-person">{cardData.costPerPersonText}</p>
                    {/* Display Deadline Info if text exists */}
                    {cardData.deadlineText && (
                        <p className={`deadline-info ${cardData.hasDeadlinePassed ? 'text-danger' : 'text-success'}`}>
                            {cardData.deadlineText}
                        </p>
                    )}
                    <p className="description">{cardData.description}</p>
                </div>

                {/* Card Actions Footer */}
                <div className="destination-card-actions">
                    <div className="vote-info">
                        <span className="vote-count">Votes: {cardData.voters}</span>

                        {/* Auth Loading State */}
                        {authLoading && (<span className="login-prompt">Loading...</span>)}

                        {/* Logged In State */}
                        {!authLoading && user && (
                            <button
                                className={cardData.voteButtonClass}
                                onClick={handleVoteClick}
                                disabled={cardData.voteButtonDisabled}
                                title={cardData.voteButtonTitle}
                            >
                                {cardData.voteButtonText}
                                {/* Show checkmark only if voted AND deadline hasn't passed */}
                                {cardData.hasVotedForThis && !cardData.hasDeadlinePassed && (
                                    <span className="voted-badge">✔</span>
                                )}
                            </button>
                        )}

                        {/* Logged Out State */}
                        {!authLoading && !user && (<span className="login-prompt">Login to vote</span>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DestinationCard;
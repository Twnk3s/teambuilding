import React, { useState, useEffect } from 'react';

/**
 * A controlled form component for adding or editing destinations.
 *
 * Props:
 *  - onSubmit (function): Called with formatted form data when submitted.
 *  - initialData (object | null): Destination data to pre-fill form for editing. If null, form is in 'add' mode.
 *  - onCancel (function): Called when the 'Cancel Edit' button is clicked (only shown when editing).
 *  - isLoading (boolean): If true, disables form inputs and buttons during submission.
 */
const AdminDestinationForm = ({ onSubmit, initialData = null, onCancel, isLoading = false }) => {
    // --- State ---
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location: '',
        cost: '', // Keep as string for input control
        imageUrl: '',
        votingDeadline: '' // Add deadline state (string for datetime-local input)
    });
    const [isEditing, setIsEditing] = useState(false); // Track if editing or adding
    const [formError, setFormError] = useState(''); // Local form validation errors

    // --- Helper Function ---
    // Formats a Date object or ISO string into the 'YYYY-MM-DDTHH:mm' format
    // required by <input type="datetime-local">.
    const formatDateForInput = (date) => {
        if (!date) return ''; // Return empty if no date provided
        try {
            const d = new Date(date);
            // Check if the date is valid after parsing
            if (isNaN(d.getTime())) return '';

            // Pad month, day, hours, minutes with leading zeros if needed
            const year = d.getFullYear();
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            const hours = d.getHours().toString().padStart(2, '0');
            const minutes = d.getMinutes().toString().padStart(2, '0');

            return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (e) {
            console.error("Error formatting date for input:", e);
            return ''; // Return empty on formatting error
        }
    };

    // --- Effects ---
    // This effect runs when the 'initialData' prop changes.
    // It populates the form for editing or resets it for adding.
    useEffect(() => {
        console.log('[AdminDestForm Effect] initialData changed:', initialData); // Log prop change
        if (initialData?._id) { // Check for essential ID to confirm it's valid edit data
            console.log('[AdminDestForm Effect] Populating form for editing.');
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                location: initialData.location || '',
                cost: initialData.cost?.toString() || '', // Convert number to string for input
                imageUrl: initialData.imageUrl || '',
                // Format the deadline (which might be ISO string or Date obj) for input
                votingDeadline: formatDateForInput(initialData.votingDeadline)
            });
            setIsEditing(true); // Set editing mode
            setFormError('');   // Clear errors from previous state
        } else {
            // Reset form to default empty state if initialData is null or invalid
            console.log('[AdminDestForm Effect] Resetting form for adding.');
            setFormData({ name: '', description: '', location: '', cost: '', imageUrl: '', votingDeadline: '' });
            setIsEditing(false); // Set adding mode
            setFormError('');
        }
    }, [initialData]); // Dependency array: only re-run when initialData changes

    // --- Handlers ---
    // Updates the corresponding field in formData state when any input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
             ...prev,
             [name]: value
        }));
        // Clear form error when user starts typing again
         if (formError) setFormError('');
    };

    // Handles the form submission event
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default browser submission
        console.log('[AdminDestForm Submit] Form submitted.');
        setFormError(''); // Clear previous validation errors

        // --- Client-Side Validation ---
        if (!formData.name || !formData.description || !formData.location || !formData.cost) {
            console.warn('[AdminDestForm Submit] Validation Failed: Missing required fields.');
            setFormError('Please fill in all required fields (marked with *).');
            return; // Stop submission
        }
        // Validate cost
        const costValue = parseFloat(formData.cost);
        if (isNaN(costValue) || costValue < 0) {
            console.warn('[AdminDestForm Submit] Validation Failed: Invalid cost value.');
            setFormError('Please enter a valid non-negative number for the cost.');
            return; // Stop submission
        }
        // Optional: Validate deadline is in the future if set
        if (formData.votingDeadline && new Date(formData.votingDeadline) <= new Date()) {
             console.warn('[AdminDestForm Submit] Validation Failed: Deadline is in the past.');
             setFormError('Voting deadline must be set to a future date and time.');
             return; // Stop submission
        }

        // --- Prepare Data for API ---
        // Create data object to send, converting cost back to number
        // and handling the deadline format (send ISO string or null)
        const dataToSend = {
             name: formData.name.trim(),
             description: formData.description.trim(),
             location: formData.location.trim(),
             cost: costValue, // Send cost as a number
             imageUrl: formData.imageUrl.trim() || null, // Send trimmed URL or null if empty
             // Convert local datetime string to ISO string if set, otherwise send null
             votingDeadline: formData.votingDeadline ? new Date(formData.votingDeadline).toISOString() : null
        };

        console.log('[AdminDestForm Submit] Validation passed. Calling onSubmit with:', dataToSend);
        // Call the onSubmit prop (passed from AdminDashboard) with the prepared data
        onSubmit(dataToSend);

        // Form reset is handled by the parent component setting initialData back to null,
        // which triggers the useEffect hook in this component.
    };

    // --- Render JSX ---
    return (
        // Use standard CSS classes for styling
        <form onSubmit={handleSubmit} className="form-container my-2" noValidate>
            {/* Dynamic form title based on mode */}
            <h2>{isEditing ? 'Edit Destination' : 'Add New Destination'}</h2>

            {/* Display form validation errors */}
            {formError && <div className="alert alert-danger mb-3">{formError}</div>}

            {/* --- Form Fields --- */}
            <div className="form-group">
                <label htmlFor="name" className="form-label">Name *</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required // HTML5 validation
                    disabled={isLoading} // Disable during form submission process
                    maxLength={100} // Match schema
                />
            </div>
            <div className="form-group">
                <label htmlFor="description" className="form-label">Description *</label>
                <textarea
                    id="description"
                    name="description"
                    className="form-control"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    rows={4} // Suggest initial height
                />
            </div>
            <div className="form-group">
                <label htmlFor="location" className="form-label">Location *</label>
                <input
                    type="text"
                    id="location"
                    name="location"
                    className="form-control"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                />
            </div>
            <div className="form-group">
                {/* Assuming cost is in a specific currency like USD */}
                <label htmlFor="cost" className="form-label">Estimated Cost (RON) *</label>
                <input
                    type="number"
                    id="cost"
                    name="cost"
                    className="form-control"
                    value={formData.cost}
                    onChange={handleChange}
                    required
                    min="0" // HTML5 non-negative validation
                    step="0.01" // Allow cents if applicable
                    disabled={isLoading}
                    placeholder="e.g., 1500"
                />
            </div>
            <div className="form-group">
                <label htmlFor="imageUrl" className="form-label">Image URL</label>
                <input
                    type="url" // Use type="url" for better semantics and basic browser validation
                    id="imageUrl"
                    name="imageUrl"
                    className="form-control"
                    value={formData.imageUrl}
                    onChange={handleChange}
                    disabled={isLoading}
                    placeholder="https://example.com/image.jpg"
                />
                <div className="form-text">Optional. Provide a direct URL (http/https) to an image.</div>
            </div>
            {/* --- Voting Deadline Input --- */}
             <div className="form-group">
                <label htmlFor="votingDeadline" className="form-label">Voting Deadline (Optional)</label>
                <input
                    type="datetime-local" // Use browser's native date & time picker
                    id="votingDeadline"
                    name="votingDeadline"
                    className="form-control"
                    value={formData.votingDeadline} // Bind to state
                    onChange={handleChange}
                    disabled={isLoading}
                    // Set min attribute to prevent selecting past dates/times via the picker
                    min={formatDateForInput(new Date())}
                />
                <div className="form-text">Set a future date and time after which voting closes. Leave blank for no deadline.</div>
            </div>
            {/* --- End Voting Deadline Input --- */}

            {/* --- Action Buttons --- */}
            <div className="d-grid gap-2"> {/* Optional: Use grid for button spacing if using Bootstrap-like utils */}
                 <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                    {isLoading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Destination' : 'Add Destination')}
                </button>

                {/* Show Cancel button only when editing */}
                 {isEditing && onCancel && (
                      <button
                        type="button"
                        onClick={onCancel} // Trigger cancel handler from parent
                        className="btn btn-light btn-block" // Use btn-light for secondary action
                        disabled={isLoading} // Disable during submission
                       >
                          Cancel Edit
                      </button>
                 )}
            </div>
        </form>
    );
};

export default AdminDestinationForm;
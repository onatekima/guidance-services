// ... existing code ...

const GuidanceAppointmentDetails = ({ appointment, onClose, onStatusChange }) => {
  // ... existing state variables ...
  
  return (
    <Modal
      title="Appointment Details"
      open={!!appointment}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        appointment?.status === 'pending' && (
          <>
            <Button 
              key="reject" 
              danger
              onClick={() => handleStatusChange('rejected')}
              loading={loading}
            >
              Reject
            </Button>
            <Button 
              key="approve" 
              type="primary"
              onClick={() => handleStatusChange('confirmed')}
              loading={loading}
            >
              Approve
            </Button>
          </>
        ),
        appointment?.status === 'confirmed' && (
          <>
            <Button 
              key="cancel" 
              danger
              onClick={() => handleStatusChange('cancelled')}
              loading={loading}
            >
              Cancel
            </Button>
            <Button 
              key="complete" 
              type="primary"
              onClick={() => handleStatusChange('completed')}
              loading={loading}
            >
              Mark as Completed
            </Button>
          </>
        )
      ].filter(Boolean)}
    >
      {appointment && (
        <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Student Information</h4>
            <p style={{ margin: '4px 0' }}><strong>Name:</strong> {appointment.studentName}</p>
            <p style={{ margin: '4px 0' }}><strong>ID:</strong> {appointment.studentId}</p>
            <p style={{ margin: '4px 0' }}><strong>Email:</strong> {appointment.studentEmail}</p>
          </div>
          
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>Appointment Information</h4>
            <p style={{ margin: '4px 0' }}><strong>Date:</strong> {appointment.date}</p>
            <p style={{ margin: '4px 0' }}><strong>Time:</strong> {appointment.timeSlot}</p>
            <p style={{ margin: '4px 0' }}><strong>Counselor Type:</strong> {getCounselorTypeLabel(appointment.counselorType)}</p>
            <p style={{ margin: '4px 0' }}><strong>Status:</strong> {getStatusTag(appointment.status)}</p>
            
            {appointment.status === 'cancelled' && (
              <>
                <p style={{ margin: '4px 0' }}><strong>Cancelled By:</strong> {appointment.cancellationBy === 'guidance' ? 'Guidance Counselor' : 'Student'}</p>
                <p style={{ margin: '4px 0' }}><strong>Cancellation Reason:</strong> {appointment.cancellationReason}</p>
                {appointment.cancellationBy === 'guidance' && (
                  <p style={{ margin: '4px 0' }}>
                    <strong>Acknowledged:</strong> {appointment.acknowledged ? 
                      <Tag color="green">Yes</Tag> : 
                      <Tag color="orange">No</Tag>
                    }
                  </p>
                )}
              </>
            )}
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <h4>Purpose of Appointment</h4>
            <p style={{ whiteSpace: 'pre-wrap' }}>{appointment.purpose}</p>
          </div>
          
          {appointment.notes && (
            <div style={{ marginBottom: '16px' }}>
              <h4>Additional Notes</h4>
              <p style={{ whiteSpace: 'pre-wrap' }}>{appointment.notes}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default GuidanceAppointmentDetails;

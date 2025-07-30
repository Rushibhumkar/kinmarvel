import React from 'react';
import {Modal, View, Text, StyleSheet, TouchableOpacity} from 'react-native';

type Props = {
  visible: boolean;
  callerId: string;
  mediaType: 'audio' | 'video';
  onAccept: () => void;
  onReject: () => void;
};

const IncomingCallModal: React.FC<Props> = ({
  visible,
  callerId,
  mediaType,
  onAccept,
  onReject,
}) => {
  return (
    <Modal animationType="slide" transparent={true} visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Incoming {mediaType} call</Text>
          <Text style={styles.subtext}>From: {callerId}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
              <Text style={styles.buttonText}>Accept</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default IncomingCallModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 300,
    padding: 25,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    marginBottom: 20,
    color: '#444',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  acceptButton: {
    backgroundColor: 'green',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  rejectButton: {
    backgroundColor: 'red',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

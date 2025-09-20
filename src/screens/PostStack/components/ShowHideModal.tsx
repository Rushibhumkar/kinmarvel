import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import CustomText from '../../../components/CustomText';
import {color} from '../../../const/color';

const options = [
  {label: 'Self', value: 'self'},
  {label: 'Public', value: 'public'},
  {label: 'Followers', value: 'followers'},
] as const;

type Audience = 'self' | 'public' | 'followers';
type ShowHideModalProps = {
  visible: boolean;
  onClose: () => void;
  selected?: Audience;
  onSelect: (option: Audience) => void;
};

const ShowHideModal: React.FC<ShowHideModalProps> = ({
  visible,
  selected,
  onClose,
  onSelect,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modal}>
              <CustomText style={styles.title}>
                Who can see your post?
              </CustomText>
              <FlatList
                data={options}
                keyExtractor={item => item.value}
                renderItem={({item}) => {
                  const isActive = item.value === selected;
                  return (
                    <TouchableOpacity
                      style={[styles.option, isActive && styles.optionActive]}
                      onPress={() => onSelect(item.value)}
                      activeOpacity={0.7}>
                      <CustomText
                        style={[
                          {color: color.titleColor},
                          isActive && styles.optionActiveText,
                        ]}>
                        {item.label}
                      </CustomText>
                    </TouchableOpacity>
                  );
                }}
              />
              <TouchableOpacity onPress={onClose} style={styles.cancel}>
                <Text style={{color: 'red'}}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default ShowHideModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  option: {
    paddingVertical: 12,
    // borderBottomWidth: 1,
    // borderColor: '#eee',
    paddingHorizontal: 12,
  },
  cancel: {
    marginTop: 10,
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: '#fec9c9ff',
    borderColor: '#dbe6ff',
    borderRadius: 12,
  },
  optionActiveText: {
    fontWeight: '700',
  },
});

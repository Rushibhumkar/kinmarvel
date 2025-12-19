import React, {useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import RelativesTree from 'react-native-relatives-tree';
import HierarchyHeader from './components/HierarchyHeader';
import {color} from '../../const/color';
import {myConsole} from '../../utils/myConsole';
import {
  addMemberToTree,
  createUserTree,
  useGetMyTree,
  useGetTreeByUserId,
} from '../../api/userTree/userTreeFunc';
import {getTextWithLength2} from '../../utils/commonFunction';
import FullHeightLoader from '../../components/LoadingCompo/FullHeightLoader';
import CustomErrorMessage from '../../components/CustomErrorMessage';
import CustomModal from '../../components/CustomModal';
import CustomText from '../../components/CustomText';
import {homeRoute, profileRoute} from '../AuthScreens/routeName';
import {useQueryClient} from '@tanstack/react-query';
import {useGetMyData} from '../../api/profile/profileFunc';
import {useAppToast} from '../../components/toast/AppToast';

const RelativeItem = ({
  level,
  info,
  style,
  matchedName,
  onSelectPerson,
  showingParent,
  myData,
  myDataLoad,
}: any) => {
  const isMatch =
    matchedName && info.name.toLowerCase() === matchedName.toLowerCase();
  const isMe = myData?.data?._id === info?._id;
  myConsole('isverfieedd', info.isVerified);
  return (
    <TouchableOpacity
      style={[
        styles.item,
        style,
        isMatch && {backgroundColor: '#4a5'},
        !info.isVerified && {backgroundColor: '#C9C9C9'}, // <---- disabled grey
      ]}
      // disabled={!info.isVerified}
      // disabled={showingParent}
      onPress={() => onSelectPerson(info)}>
      <Text style={{color: '#fff', fontWeight: 'bold'}}>
        {getTextWithLength2(info.name || '', 12)}
      </Text>
      <Text style={{fontSize: 12, color: '#fff'}}>
        {info.relation ? `(${info.relation})` : ''}
      </Text>
      {/* <Text style={{fontSize: 12, color: '#fff'}}>({level})</Text> */}
      {info.kunbiMaratha === true && (
        <Text style={{fontSize: 10, color: '#21983fff', fontWeight: '600'}}>
          कुणबी मराठा
        </Text>
      )}
    </TouchableOpacity>
  );
};

const Hierarchy = ({navigation}: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [matchedName, setMatchedName] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [pendingNewMember, setPendingNewMember] = useState<any>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showingParent, setShowingParent] = useState(false);

  const {data: myData, isLoading: myDataLoad} = useGetMyData();
  const queryClient = useQueryClient();
  const toast = useAppToast();
  const {
    data: myTreeData,
    isLoading: myTreeLoad,
    isError: myTreeErr,
    refetch: refetchMyTree,
  } = useGetMyTree();

  const parentTreeId = myTreeData?.data?.parentTreeId;

  const {
    data: treeByIdData,
    isLoading: treeByIdLoad,
    isError: treeByIdErr,
    refetch: treeByIdRefetch,
  } = useGetTreeByUserId(showingParent ? parentTreeId : null);

  myConsole('myTreeData', myTreeData);
  myConsole('treeByIdData', treeByIdData);

  const onRefresh = async () => {
    setRefreshing(true);
    if (showingParent) {
      await treeByIdRefetch();
    } else {
      await refetchMyTree();
    }
    setRefreshing(false);
  };

  React.useEffect(() => {
    if (myTreeData && !myTreeData?.data) {
      (async () => {
        try {
          setRefreshing(true);
          await createUserTree();
          await refetchMyTree();
        } catch (e: any) {
          const errMsg =
            'Add Date of Birth and Gender to create your family tree';
          Alert.alert('Error', errMsg, [
            {
              text: 'Add Data',
              onPress: () => navigation.navigate(profileRoute.ProfileSetup),
            },
            {text: 'OK', style: 'cancel'},
          ]);
        } finally {
          setRefreshing(false);
        }
      })();
    }
  }, [myTreeData]);

  const transformTreeData = (node: any): any => {
    myConsole('nodeeee', node);
    return {
      // _id:
      //   node?.userId?._id || node?.memberTreeId?.userId?._id || '',
      _id:
        node?.userId?._id || node?.memberTreeId?.userId?._id || node?._id || '',
      name:
        node.name ||
        node.memberTreeId?.userId?.fullName ||
        node.memberTreeId?.userId?.firstName ||
        node.memberTreeId?.fullName ||
        node.memberTreeId?.firstName ||
        '',
      relation: node.relation || '',
      // dob: node.dob || node.memberId?.dob || '',
      dob:
        node?.dob ||
        node?.userId?.dynamicData?.dob ||
        node?.memberTreeId?.dob ||
        '',

      gender: node.gender || node.memberId?.gender || '',
      isVerified:
        node.isVerified ??
        node.memberTreeId?.isVerified ??
        node.memberTreeId?.userId?.isVerified ??
        false,
      kunbiMaratha:
        node?.userId?.dynamicData?.kunbiMaratha ??
        node?.memberTreeId?.userId?.dynamicData?.kunbiMaratha ??
        null,
      spouse: node.spouse?.length ? node.spouse[0] : null,
      children: (node.children || node.memberTreeId?.children || []).map(
        (child: any) => transformTreeData(child),
      ),
    };
  };

  const activeTree = showingParent ? treeByIdData?.data : myTreeData?.data;
  const parsedTreeData = transformTreeData(activeTree || {});
  const searchTree = (nodes: any[]): boolean => {
    for (const node of nodes) {
      // if (
      //   node.name.toLowerCase() === searchQuery.toLowerCase() ||
      //   node.memberTreeId?.userId?.fullName?.toLowerCase() ===
      //     searchQuery.toLowerCase() ||
      //   node.memberTreeId?.userId?.firstName?.toLowerCase() ===
      //     searchQuery.toLowerCase()
      // ) {
      //   setMatchedName(
      //     node.name ||
      //       node.memberTreeId?.userId?.fullName ||
      //       node.memberTreeId?.userId?.firstName,
      //   );
      //   return true;
      // }
      if (
        node?.name?.toLowerCase() === searchQuery.toLowerCase() ||
        node?.userId?.fullName?.toLowerCase() === searchQuery.toLowerCase() ||
        node?.userId?.firstName?.toLowerCase() === searchQuery.toLowerCase()
      ) {
        setMatchedName(
          node?.name || node?.userId?.fullName || node?.userId?.firstName,
        );
        return true;
      }

      if (
        node.spouse &&
        node.spouse.name?.toLowerCase() === searchQuery.toLowerCase()
      ) {
        setMatchedName(node.spouse.name);
        return true;
      }

      if (node.children && searchTree(node.children)) return true;
    }
    return false;
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setMatchedName(null);
      setSearchResult(null);
      return;
    }
    const found = searchTree([parsedTreeData]);

    setSearchResult(found ? 'Found' : 'Not found');
    if (!found) setMatchedName(null);
  };

  const handleAddMember = async () => {
    try {
      myConsole('pendingNewMemberrr', pendingNewMember);
      const response = await addMemberToTree(pendingNewMember);
      myConsole('Add Member API Response:', response);

      queryClient.invalidateQueries({queryKey: ['myTree']});
      queryClient.invalidateQueries({queryKey: ['treeByUser']});

      setConfirmModalVisible(false);
      setPendingNewMember(null);
      navigation.goBack();

      toast.success('Member Added Successfully !');
    } catch (err) {
      console.log('Failed to add member:', err);
      const errorMessage =
        err?.response?.data?.message || 'Failed to add member to tree.';
      Alert.alert('Error', errorMessage);
    }
  };
  // myConsole('myData?.data?._id', myData?.data?._id);
  myConsole('selectedPerso', selectedPerson);
  return (
    <SafeAreaView style={styles.main}>
      <HierarchyHeader />

      <CustomModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}>
        <View style={{gap: 16, justifyContent: 'center', alignItems: 'center'}}>
          <TouchableOpacity
            style={{
              backgroundColor: color.mainColor,
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 12,
            }}
            activeOpacity={0.6}
            onPress={() => {
              setModalVisible(false);
              if (selectedPerson?._id) {
                navigation.navigate(homeRoute.HomeStack, {
                  screen: homeRoute.UsersProfileDetails,
                  params: {
                    id: selectedPerson._id,
                    showBasicDetails: true,
                    showChatIcon: false,
                  },
                });
              }
            }}>
            <CustomText
              style={{color: '#fff', fontSize: 15, fontWeight: '500'}}>
              Show User Details
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: color.mainColor,
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 12,
            }}
            activeOpacity={0.6}
            onPress={() => {
              navigation.navigate(profileRoute.AddMember, {
                onSubmit: (data: any) => {
                  const payload = {
                    ...data,
                    selectedUserId:
                      selectedPerson && selectedPerson._id !== myData?.data?._id
                        ? selectedPerson._id
                        : undefined,
                  };
                  setPendingNewMember(payload);
                  setModalVisible(false);
                  setConfirmModalVisible(true);
                },
              });
            }}>
            <CustomText
              style={{color: '#fff', fontSize: 15, fontWeight: '500'}}>
              Add User in Tree
            </CustomText>
          </TouchableOpacity>
        </View>
      </CustomModal>
      <CustomModal
        visible={confirmModalVisible}
        onClose={() => setConfirmModalVisible(false)}>
        {pendingNewMember ? (
          <View style={{padding: 16, gap: 12, alignItems: 'center'}}>
            <CustomText style={{fontSize: 16, fontWeight: '600'}}>
              Confirm Member Details
            </CustomText>
            <CustomText>Relation: {pendingNewMember.relation}</CustomText>
            <CustomText>Gender: {pendingNewMember.gender}</CustomText>
            {pendingNewMember.userId ? (
              <CustomText>User ID: {pendingNewMember.userId}</CustomText>
            ) : (
              <>
                <CustomText>Name: {pendingNewMember.fName}</CustomText>
                <CustomText>Phone: {pendingNewMember.phone}</CustomText>
              </>
            )}
            <TouchableOpacity
              style={styles.addNewMemberBtn}
              onPress={handleAddMember}>
              <CustomText style={{color: '#fff'}}>Add</CustomText>
            </TouchableOpacity>
          </View>
        ) : (
          <CustomText style={{textAlign: 'center'}}>
            No member data found to add.
          </CustomText>
        )}
      </CustomModal>

      <View style={styles.searchBar}>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Search by name..."
            style={styles.input}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholderTextColor={'grey'}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}>
              <Image
                source={require('../../assets/icons/close.png')}
                style={{width: 16, height: 16, tintColor: 'grey'}}
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
          <Text style={{color: '#fff'}}>Search</Text>
        </TouchableOpacity>
      </View>

      {parentTreeId && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            // alignSelf: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: 8,
            paddingHorizontal: 12,
          }}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <View
              style={{
                width: 16,
                height: 16,
                backgroundColor: '#C9C9C9',
                borderRadius: 4,
              }}
            />
            <Text style={{color: '#555'}}>Not Verified</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowingParent(prev => !prev)}
            style={styles.showParentTreeBtn}>
            <Text style={{color: '#fff'}}>
              {showingParent ? 'Hide Parent Tree' : 'Show Parent Tree'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {/* <TouchableOpacity
        onPress={() => null}
        style={{
          alignSelf: 'flex-end',
          marginHorizontal: 10,
          marginBottom: 10,
          backgroundColor: color.mainColor,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 8,
          padding: 12,
          zIndex: 10,
        }}>
        <Image
          source={require('../../assets/icons/add.png')}
          style={{height: 24, width: 24}}
          tintColor={'#fff'}
        />
      </TouchableOpacity> */}

      {searchResult && (
        <Text style={styles.status}>
          {searchResult === 'Found'
            ? '✅ Person found and highlighted'
            : '❌ Not found'}
        </Text>
      )}
      {myTreeLoad || (showingParent && treeByIdLoad) ? (
        <FullHeightLoader />
      ) : myTreeErr || (showingParent && treeByIdErr) ? (
        <CustomErrorMessage
          message={'Failed to load tree.'}
          onRetry={onRefresh}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{flexGrow: 1}}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <RelativesTree
            data={[parsedTreeData]}
            spouseKey="spouse"
            cardWidth={80}
            gap={10}
            relativeItem={props => (
              <RelativeItem
                showingParent={showingParent}
                myData={myData?.data}
                myDataLoad={myDataLoad}
                {...props}
                matchedName={matchedName}
                onSelectPerson={person => {
                  myConsole('ssssssss', person);
                  setSelectedPerson(person);
                  setModalVisible(true);
                }}
              />
            )}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  main: {
    flex: 1,
  },
  item: {
    height: 80,
    width: 80,
    backgroundColor: `${color.mainColor}90`,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    margin: 10,
    gap: 10,
  },
  addNewMemberBtn: {
    marginTop: 12,
    backgroundColor: color.mainColor,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  inputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 40,
    backgroundColor: '#fff',
  },

  input: {
    flex: 1,
    color: '#000',
  },

  clearButton: {
    paddingHorizontal: 6,
  },

  searchBtn: {
    backgroundColor: '#4a5',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  status: {
    marginHorizontal: 10,
    marginBottom: 5,
    fontSize: 14,
    color: '#555',
  },
  showParentTreeBtn: {
    alignSelf: 'flex-end',
    backgroundColor: color.mainColor,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    zIndex: 10,
  },
});

export default Hierarchy;

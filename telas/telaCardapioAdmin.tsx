import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { stylesPadrao } from "../styles/stylesDefault";
import { db, storage } from "../apis/firebaseConfig";
import { styleCardapio } from "../styles/stylesCardapioAdmin";
import { arrayUnion, doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import SwitchSelector from "react-native-switch-selector";
import BottomSheet from "@gorhom/bottom-sheet";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import MCI from "react-native-vector-icons/MaterialCommunityIcons";
import * as ImagePicker from "expo-image-picker";

export default function TelaCardapioAdmin() {
  const { width } = Dimensions.get("window");

  // useStates pra definir valores digitados nos inputs

  const [precoPizza, setPrecoPizza] = useState("");
  const [nomePizza, setNomePizza] = useState("");
  const [urlPizza, setUrlPizza] = useState("");

  // verificador de link válido
  const urlRegex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;

  // try-catch pra add as pizzas no cardapio

  async function addPizzaOnPress() {
    if (precoPizza === "" || nomePizza === "" || previewImage === "") {
      alert("Preencha todos os campos antes de continuar.");
    } else if (!urlRegex.test(imageURL)) {
      alert("O texto inserido no campo de link de imagem não é um URL válido.");
    } else {
      try {
        const docRef = await updateDoc(doc(db, "pizzaCards", pizzaRef), {
          pizzaPreco: arrayUnion("R$" + precoPizza),
          pizzaTitle: arrayUnion(nomePizza),
          pizzaURL: arrayUnion(imageURL),
        });
        return [
          docRef,
          console.log("Documento Alterado com sucesso"),
          alert("Sabor adicionado com sucesso!"),
          setTimeout(() => {
            setImageUrl("");
            setNomePizza("");
            setPrecoPizza("");
            setPreviewImage(null);
          }, 2000),
        ];
      } catch (e) {
        console.error("Erro ao alterar documento:", e);
      }
    }
  }

  //configurações da modal de info sobre imagens

  const refModal = useRef(null);
  const snapPointModal = useMemo(() => ["20%", "34%"], []);
  const handleOpenModal = () => refModal.current?.expand();

  const refPreco = useRef(null);
  const snapPointPreco = useMemo(() => ["18%", "18%"], []);
  const handleOpenPreco = () => refPreco.current?.expand();

  // função de pegar imagens, mostrar previa e gerar link
  const [previewImage, setPreviewImage] = useState(null);

  const [imageURL, setImageUrl] = useState("");

  const [modalVisivel, setModalVisivel] = useState(false);

  function timerModal() {
    // timeout de modal que avisa que obteve sucesso na criação de link
    setModalVisivel(true);
    setTimeout(() => {
      setModalVisivel(false);
    }, 1000);
  }

  const pegarImagens = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.7,
    });
    if (!result.canceled) {
      setPreviewImage(result.assets[0].uri);
      uploadImage(result.assets[0].uri, "image");
    }

    async function uploadImage(uri, fileType) {
      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, "PizzaImages/" + new Date().getTime());
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        "state_changed",
        () => {
          console.log("transferindo imagens para db...");
        },
        (error) => {
          console.log("Erro: " + error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
            console.log(
              "Imagem transferida com sucesso. Disponível em: " + downloadURL
            );
            setImageUrl(downloadURL);
            timerModal();
            setUrlPizza(downloadURL);
          });
        }
      );
    }
  };

  // nomes de documentos - valores para seletor switch

  const [pizzaRef, setPizzaRef] = useState("");

  const options = [
    { label: "Salgada", value: "pizzaSal" },
    { label: "Doce", value: "pizzaDoce" },
    { label: "Bebida", value: "pizzaBebida" },
  ];

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={stylesPadrao.safeAreaAlign}>
        <ScrollView>
          <View style={stylesPadrao.titleAlign}>
            <Text style={stylesPadrao.titleStyle}>Editar Cardápio</Text>
          </View>

          <View style={styleCardapio.fullViewAlign}>
            <View>
              <View style={{ marginBottom: 10 }}>
                <Text style={stylesPadrao.subTitle400}>
                  Tipo de pizza/item:
                </Text>
              </View>

              <View style={{ marginBottom: 10 }}>
                <SwitchSelector
                  options={options}
                  initial={0}
                  onPress={(value) => setPizzaRef(value)}
                  selectedColor={"#000"}
                  buttonColor={"#fcba04"}
                  textStyle={styleCardapio.switchStyle}
                  selectedTextStyle={styleCardapio.switchStyle}
                />
              </View>
              {/* textinput de titulo da pizza */}
              <View>
                <Text style={stylesPadrao.subTitle400}>Nome do item:</Text>
                <TextInput
                  selectionColor={"#d69e04"}
                  style={stylesPadrao.defaultInput}
                  placeholder="Digite o nome do item"
                  onChangeText={setNomePizza}
                  value={nomePizza}
                />
                <View style={styleCardapio.modalIconAlign}>
                  <Text style={stylesPadrao.subTitle400}>Preço do item:</Text>
                  <Pressable onPress={handleOpenPreco}>
                    <MCI name="information" size={20} />
                  </Pressable>
                </View>
                <TextInput
                  selectionColor={"#d69e04"}
                  style={stylesPadrao.defaultInput}
                  placeholder="Digite o preço do item"
                  onChangeText={setPrecoPizza}
                  value={precoPizza}
                />

                <Text style={stylesPadrao.subTitle400}>Imagem do item:</Text>
              </View>
            </View>

            <View style={styleCardapio.alignImagePlaceholder}>
              <View style={styleCardapio.imagePlaceholder}>
                {previewImage && (
                  <Image
                    source={{ uri: previewImage }}
                    style={{ width: width * 0.75, height: width * 0.75 }}
                  />
                )}
              </View>
            </View>

            <Pressable onPress={pegarImagens}>
              <View style={styleCardapio.addImageAlign}>
                <View style={stylesPadrao.btn}>
                  <Text style={stylesPadrao.btnText}>Adicionar Imagem</Text>
                </View>
              </View>
            </Pressable>
          </View>

          <Text
            style={[
              stylesPadrao.subTitle600,
              { marginHorizontal: width * 0.05 },
            ]}
          >
            Prévia:
          </Text>

          <View style={styleCardapio.previewCardAlign}>
            <View style={styleCardapio.styleCard}>
              <Image
                source={{ uri: previewImage }}
                style={styleCardapio.styleImage}
              />
              <View>
                <Text style={styleCardapio.pizzaTitle}>{nomePizza}</Text>
                <Text style={styleCardapio.precoAlign}>R${precoPizza}</Text>
              </View>
            </View>
          </View>

          <View style={styleCardapio.alignPizzaBtns}>
            <Pressable onPress={addPizzaOnPress}>
              <View style={stylesPadrao.btn}>
                <Text style={stylesPadrao.btnText}>Adicionar</Text>
              </View>
            </Pressable>
          </View>

          <BottomSheet
            ref={refPreco}
            index={-1}
            snapPoints={snapPointPreco}
            enablePanDownToClose={true}
            style={[stylesPadrao.modalStyle, { alignItems: "center" }]}
            backgroundStyle={{ backgroundColor: "#fafafa" }}
          >
            <View style={stylesPadrao.modalContainer}>
              <View style={stylesPadrao.modalTitleAlign}>
                <Text
                  style={[stylesPadrao.modalTitle, { textAlign: "center" }]}
                >
                  Aviso
                </Text>
              </View>

              <View>
                <Text
                  style={[stylesPadrao.regularFont400, { textAlign: "center" }]}
                >
                  Padronizar: sempre usar decimais nos preços. Exemplo: {"\n"}
                  "R$40,00"
                </Text>
              </View>
            </View>
          </BottomSheet>

          <BottomSheet
            ref={refModal}
            index={-1}
            snapPoints={snapPointModal}
            enablePanDownToClose={true}
            style={stylesPadrao.modalStyle}
            backgroundStyle={{ backgroundColor: "#fafafa" }}
          >
            <View style={stylesPadrao.modalContainer}>
              <View style={stylesPadrao.modalTitleAlign}>
                <Text
                  style={[stylesPadrao.modalTitle, { textAlign: "center" }]}
                >
                  Porquê um URL e não uma imagem da galeria?
                </Text>
              </View>

              <View>
                <Text
                  style={[stylesPadrao.regularFont400, { textAlign: "center" }]}
                >
                  O banco de dados só consegue identificar imagens se elas forem
                  links.{"\n"}
                  {"\n"}
                  Caso você não tenha um link pronto, use a função de fazer
                  upload de imagem. Essa função recebe imagens da sua galeria e
                  já gera um link legível para o banco de dados.
                </Text>
              </View>
            </View>
          </BottomSheet>

          {/* <BottomSheet
            ref={refGerarLink}
            index={-1}
            snapPoints={snapPointGerarLink}
            enablePanDownToClose={true}
            style={[stylesPadrao.modalStyle, { alignItems: "center" }]}
            backgroundStyle={{ backgroundColor: "#fafafa" }}
          >
            <View style={stylesPadrao.modalContainer}>
              <View style={stylesPadrao.modalTitleAlign}>
                <Text style={stylesPadrao.modalTitle}>Gerar Link</Text>
              </View>

              <Text style={[stylesPadrao.subTitle400, { marginBottom: 10 }]}>
                Imagem escolhida:
              </Text>
              <View style={styleCardapio.imagePlaceholder}>
                {previewImage && (
                  <Image
                    source={{ uri: previewImage }}
                    style={{ width: width * 0.75, height: width * 0.75 }}
                  />
                )}
              </View>

              <View style={{ alignItems: "center", marginVertical: 20 }}>
                <Pressable onPress={pegarImagens}>
                  <View>
                    <View style={stylesPadrao.btn}>
                      <Text style={stylesPadrao.btnText}>Adicionar</Text>
                    </View>
                  </View>
                </Pressable>
              </View>
            </View>
          </BottomSheet> */}

          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisivel}
            onRequestClose={() => {
              setModalVisivel(!modalVisivel);
            }}
          >
            <View style={styleCardapio.modalCentralizada}>
              <View style={styleCardapio.modalLinkStyle}>
                <Text style={stylesPadrao.regularFont400}>
                  Link gerado com sucesso!
                </Text>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
